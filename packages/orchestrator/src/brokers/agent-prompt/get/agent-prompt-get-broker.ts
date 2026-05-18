/**
 * PURPOSE: Resolves an agent name to its prompt data and appends a "Work item context"
 * block listing questId, workItemId, role, and any packagesAffected / wardMode info from
 * quest.json. Every caller is a Task()-dispatched sub-agent under `/dumpster-launch`, so
 * questId and workItemId are always supplied.
 *
 * Session id capture (per plan/piped-dancing-boole.md "Session id capture mechanism"):
 *   v1 uses Fallback B (defer-to-line-emit). MCP stdio transport does NOT expose a per-call session
 *   id to handlers (interactionFlow forwards only {args}), so this broker does NOT persist
 *   sessionId onto quest.workItems[workItemId] up front. ChatEntry → quest routing is reconstructed
 *   on the fly by chatLineProcessTransformer's parent_tool_use_id correlation. Revisit if a future
 *   Claude Code version surfaces transport metadata.
 *
 * USAGE:
 * const augmented = await agentPromptGetBroker({ agent: 'codeweaver', questId, workItemId });
 * // Returns AgentPromptResult whose `prompt` has the work-item context block appended
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
import { workItemContextBlockTransformer } from '../../../transformers/work-item-context-block/work-item-context-block-transformer';
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

  const contextBlock = workItemContextBlockTransformer({ quest, workItem });

  return agentPromptResultContract.parse({
    name: base.name,
    model: base.model,
    prompt: `${base.prompt}${contextBlock}`,
  });
};
