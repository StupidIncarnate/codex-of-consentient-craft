/**
 * PURPOSE: Resolves an agent name to its fully-substituted prompt for a dispatched agent
 * session. Loads the quest + the calling agent's work item, then delegates to
 * `workItemToPromptTransformer`, which resolves the work item's `operations/<id>` ref and
 * substitutes `$ARGUMENTS` in the prompt template with the operation-relay context.
 *
 * Broker-owned I/O: flowrider/siegemaster own their dev server via Playwright `webServer`. The
 * broker resolves `.dungeonmaster.json` (`devServer.devCommand` + `devServer.port`) and hands
 * the command + URL to the transformer.
 *
 * Session id capture: this broker does NOT persist sessionId itself — MCP stdio carries
 * no per-call session metadata. The capture happens in the JSONL watcher: when each
 * Task-dispatched sub-agent's first user-text line lands (Claude CLI passes the parent's
 * Task.input.prompt verbatim), `start-subagent-tail-layer-broker` extracts the embedded
 * `workItemId: "<uuid>"` + `questId: "<uuid>"` and fires `onSessionIdLearned` with the
 * sub-agent's realAgentId as the sessionId. `quest-monitor-watcher-start-broker` wires
 * that hook to `questModifyBroker`, stamping `quest.workItems[workItemId].sessionId`.
 *
 * USAGE:
 * const result = await agentPromptGetBroker({ agent: 'codeweaver', questId, workItemId });
 * // Returns AgentPromptResult whose `prompt` has $ARGUMENTS substituted with operation context
 */

import { pathJoinAdapter, processCwdAdapter } from '@dungeonmaster/shared/adapters';
import {
  agentPromptResultContract,
  filePathContract,
  type AgentPromptResult,
  type QuestId,
  type QuestWorkItemId,
} from '@dungeonmaster/shared/contracts';
import {
  dungeonmasterHomeStatics,
  environmentStatics,
  locationsStatics,
} from '@dungeonmaster/shared/statics';

import { dungeonmasterConfigResolveAdapter } from '../../../adapters/dungeonmaster-config/resolve/dungeonmaster-config-resolve-adapter';
import { agentPromptNameContract } from '../../../contracts/agent-prompt-name/agent-prompt-name-contract';
import { devCommandContract } from '../../../contracts/dev-command/dev-command-contract';
import { devServerUrlContract } from '../../../contracts/dev-server-url/dev-server-url-contract';
import { agentPromptClassificationStatics } from '../../../statics/agent-prompt-classification/agent-prompt-classification-statics';
import { agentNameToPromptTransformer } from '../../../transformers/agent-name-to-prompt/agent-name-to-prompt-transformer';
import { workItemToPromptTransformer } from '../../../transformers/work-item-to-prompt/work-item-to-prompt-transformer';
import { questFindQuestPathBroker } from '../../quest/find-quest-path/quest-find-quest-path-broker';
import { questLoadBroker } from '../../quest/load/quest-load-broker';

export const agentPromptGetBroker = async ({
  agent,
  questId,
  workItemId,
}: {
  agent: string;
  questId: QuestId;
  workItemId?: QuestWorkItemId;
}): Promise<AgentPromptResult> => {
  const parsedAgent = agentPromptNameContract.parse(agent);
  const base = agentNameToPromptTransformer({ agent: parsedAgent });

  // Minion-fetch: a parent-summoned sub-agent minion (chaoswhisperer-gap-minion,
  // codeweaver-minion, lawbringer-minion, blightwarden-*-minion) has no work item of its own. It fetches its served methodology with
  // { agent, questId } only; the parent briefs slice/task context inline in its Agent dispatch.
  // No quest load, no work-item context block. A ROLE name (dispatched as its own work item by
  // /dumpster-launch) MUST supply a workItemId — reject one that omits it.
  if (workItemId === undefined) {
    const isMinion = agentPromptClassificationStatics.minionNames.some(
      (name) => name === parsedAgent,
    );
    if (!isMinion) {
      throw new Error(`agentPromptGetBroker: role "${parsedAgent}" requires a workItemId`);
    }
    return agentPromptResultContract.parse({
      name: base.name,
      model: base.model,
      prompt: base.prompt.replace('$ARGUMENTS', `Quest ID: ${String(questId)}`),
    });
  }

  const { questPath } = await questFindQuestPathBroker({ questId });
  const questFilePath = filePathContract.parse(
    pathJoinAdapter({ paths: [questPath, locationsStatics.quest.questFile] }),
  );
  const quest = await questLoadBroker({ questFilePath });

  const workItem = quest.workItems.find((item) => item.id === workItemId);
  if (workItem === undefined) {
    throw new Error(`agentPromptGetBroker: workItem ${workItemId} not found on quest ${questId}`);
  }

  // Siegemaster AND Flowrider own their dev server through Playwright's webServer config.
  // Resolve the dev-server command + URL from .dungeonmaster.json here; the transformer injects
  // them into the operation context.
  const devServer = await (async (): Promise<
    Parameters<typeof workItemToPromptTransformer>[0]['devServer']
  > => {
    if (workItem.role !== 'siegemaster' && workItem.role !== 'flowrider') {
      return undefined;
    }
    // The config-find chain dirname()s startPath on its first iteration — it expects a FILE, so it
    // can search the file's containing directory. Hand it the repo-root config file itself
    // (<cwd>/.dungeonmaster.json), NOT the bare cwd directory: a bare directory dirname()s to cwd's
    // PARENT, walks above the repo root, misses the config, and silently drops dev-server injection.
    const startPath = filePathContract.parse(
      pathJoinAdapter({
        paths: [processCwdAdapter(), dungeonmasterHomeStatics.paths.projectConfigFile],
      }),
    );
    // Absence of a config file (ConfigNotFoundError) is a legitimate "no dev server" state; any
    // other error (malformed JSON, validation, permissions) MUST surface.
    const config = await (async () => {
      try {
        return await dungeonmasterConfigResolveAdapter({ startPath });
      } catch (error: unknown) {
        if (error instanceof Error && error.name === 'ConfigNotFoundError') {
          return null;
        }
        throw error;
      }
    })();
    if (config?.devServer === undefined) {
      return undefined;
    }
    const { devCommand, port } = config.devServer;
    return {
      devCommand: devCommandContract.parse(devCommand),
      devServerUrl: devServerUrlContract.parse(
        `http://${environmentStatics.hostname}:${String(port)}`,
      ),
    };
  })();

  const { prompt } = workItemToPromptTransformer({
    quest,
    workItem,
    agentName: parsedAgent,
    ...(devServer === undefined ? {} : { devServer }),
  });

  return agentPromptResultContract.parse({
    name: base.name,
    model: base.model,
    prompt,
  });
};
