/**
 * PURPOSE: Resolves an agent name to its fully-substituted prompt for a Task-dispatched
 * sub-agent under `/dumpster-launch`. Loads the quest + the calling sub-agent's work item,
 * then delegates to `workItemToPromptTransformer` which builds a role-specific WorkUnit from
 * `workItem.relatedDataItems` and substitutes `$ARGUMENTS` in the prompt template.
 *
 * Recovery delivery (broker-owned I/O):
 * - Spiritmender: recovery batches arrive via a `spiritmender-batches/<workItemId>.json` sidecar
 *   (no steps/<id> relatedDataItem). When present, the broker reads + parses it and passes the
 *   batch to the pure transformer. Absent sidecar => the transformer's step-ref path.
 * - Siegemaster: runtime flows own their dev server via Playwright `webServer`. The broker
 *   resolves `.dungeonmaster.json` (`devServer.devCommand` + `devServer.port`) and hands the
 *   command + URL to the transformer, which applies them only for runtime flows.
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
 * // Returns AgentPromptResult whose `prompt` has $ARGUMENTS substituted with role-specific context
 */

import { pathJoinAdapter, processCwdAdapter } from '@dungeonmaster/shared/adapters';
import {
  agentPromptResultContract,
  filePathContract,
  stepFileReferenceContract,
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
import { fsReadFileAdapter } from '../../../adapters/fs/read-file/fs-read-file-adapter';
import { agentPromptNameContract } from '../../../contracts/agent-prompt-name/agent-prompt-name-contract';
import { devCommandContract } from '../../../contracts/dev-command/dev-command-contract';
import { devServerUrlContract } from '../../../contracts/dev-server-url/dev-server-url-contract';
import { agentPromptClassificationStatics } from '../../../statics/agent-prompt-classification/agent-prompt-classification-statics';
import { agentNameToPromptTransformer } from '../../../transformers/agent-name-to-prompt/agent-name-to-prompt-transformer';
import { parseBatchFileTransformer } from '../../../transformers/parse-batch-file/parse-batch-file-transformer';
import { workItemToPromptTransformer } from '../../../transformers/work-item-to-prompt/work-item-to-prompt-transformer';
import { questFindQuestPathBroker } from '../../quest/find-quest-path/quest-find-quest-path-broker';
import { questLoadBroker } from '../../quest/load/quest-load-broker';

const SPIRITMENDER_BATCHES_DIR = 'spiritmender-batches';

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

  // Minion-fetch: a parent-summoned sub-agent minion (gap, pathseeker-surface/dedup/assertion,
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

  // Spiritmender recovery batches are delivered via a sidecar file written by the ward broker /
  // signal-back responder — they carry NO steps/<id> relatedDataItem. Read the sidecar here (I/O
  // lives in the broker); the pure transformer receives the parsed batch. If no sidecar exists,
  // leave spiritmenderBatch undefined and the transformer falls back to the step-ref path.
  const spiritmenderBatch = await (async (): Promise<
    Parameters<typeof workItemToPromptTransformer>[0]['spiritmenderBatch']
  > => {
    if (workItem.role !== 'spiritmender') {
      return undefined;
    }
    const batchFilePath = filePathContract.parse(
      pathJoinAdapter({
        paths: [questPath, SPIRITMENDER_BATCHES_DIR, `${String(workItem.id)}.json`],
      }),
    );
    // A missing sidecar is the legitimate step-ref fallback case — read errors mean "no batch".
    const contents = await (async () => {
      try {
        return await fsReadFileAdapter({ filePath: batchFilePath });
      } catch {
        return null;
      }
    })();
    if (contents === null) {
      return undefined;
    }
    const { filePaths, errors, verificationCommand, contextInstructions } =
      parseBatchFileTransformer({ contents });
    return {
      // Re-brand the sidecar's AbsoluteFilePath values to the WorkUnit's FilePath brand.
      filePaths: filePaths.map((fp) => stepFileReferenceContract.shape.path.parse(String(fp))),
      ...(errors.length === 0 ? {} : { errors }),
      ...(verificationCommand === undefined ? {} : { verificationCommand }),
      ...(contextInstructions === undefined ? {} : { contextInstructions }),
    };
  })();

  // Siegemaster AND Flowrider runtime flows own their dev server through Playwright's webServer
  // config. Resolve the dev-server command + URL from .dungeonmaster.json here; the transformer
  // applies them only when the resolved flow is a runtime flow (operational flows get no server).
  const siegeDevServer = await (async (): Promise<
    Parameters<typeof workItemToPromptTransformer>[0]['siegeDevServer']
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
    ...(spiritmenderBatch === undefined ? {} : { spiritmenderBatch }),
    ...(siegeDevServer === undefined ? {} : { siegeDevServer }),
  });

  return agentPromptResultContract.parse({
    name: base.name,
    model: base.model,
    prompt,
  });
};
