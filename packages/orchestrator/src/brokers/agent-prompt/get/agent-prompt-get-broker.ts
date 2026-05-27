/**
 * PURPOSE: Resolves an agent name to its fully-substituted prompt for a Task-dispatched
 * sub-agent under `/dumpster-launch`. Loads the quest + the calling sub-agent's work item,
 * then delegates to `workItemToPromptTransformer` which builds a role-specific WorkUnit from
 * `workItem.relatedDataItems` and substitutes `$ARGUMENTS` in the prompt template.
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

import { pathJoinAdapter } from '@dungeonmaster/shared/adapters';
import {
  agentPromptResultContract,
  filePathContract,
  type AgentPromptResult,
  type QuestId,
  type QuestWorkItemId,
} from '@dungeonmaster/shared/contracts';
import { locationsStatics } from '@dungeonmaster/shared/statics';

import { agentPromptNameContract } from '../../../contracts/agent-prompt-name/agent-prompt-name-contract';
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
  workItemId: QuestWorkItemId;
}): Promise<AgentPromptResult> => {
  const parsedAgent = agentPromptNameContract.parse(agent);
  const base = agentNameToPromptTransformer({ agent: parsedAgent });

  const { questPath } = await questFindQuestPathBroker({ questId });
  const questFilePath = filePathContract.parse(
    pathJoinAdapter({ paths: [questPath, locationsStatics.quest.questFile] }),
  );
  const quest = await questLoadBroker({ questFilePath });

  const workItem = quest.workItems.find((item) => item.id === workItemId);
  if (workItem === undefined) {
    throw new Error(`agentPromptGetBroker: workItem ${workItemId} not found on quest ${questId}`);
  }

  const { prompt } = workItemToPromptTransformer({ quest, workItem, agentName: parsedAgent });

  return agentPromptResultContract.parse({
    name: base.name,
    model: base.model,
    prompt,
  });
};
