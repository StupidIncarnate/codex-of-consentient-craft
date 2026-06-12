/**
 * PURPOSE: Resolves an agent name to its prompt data for the get-agent-prompt MCP tool.
 * For a work-item caller (questId + workItemId) it reads quest.json and appends a "Work item
 * context" block. For a parent-summoned minion (questId only, no workItemId) it returns the served
 * template directly — the parent briefs slice/task context inline.
 *
 * USAGE:
 * const augmented = await AgentPromptFlow.get({ agent: 'codeweaver', questId, workItemId });
 * // Returns AgentPromptResult whose prompt has the work-item context block appended
 */

import type { AgentPromptResult, QuestId, QuestWorkItemId } from '@dungeonmaster/shared/contracts';

import { AgentPromptGetResponder } from '../../responders/agent-prompt/get/agent-prompt-get-responder';

export const AgentPromptFlow = {
  get: async ({
    agent,
    questId,
    workItemId,
  }: {
    agent: string;
    questId: QuestId;
    workItemId?: QuestWorkItemId;
  }): Promise<AgentPromptResult> =>
    AgentPromptGetResponder({
      agent,
      questId,
      ...(workItemId !== undefined && { workItemId }),
    }),
};
