/**
 * PURPOSE: Resolves an agent name to its prompt data for the get-agent-prompt MCP tool.
 * Reads quest.json for the supplied questId and appends a "Work item context" block to the
 * returned prompt. questId and workItemId are required — every caller is a Task()-dispatched
 * sub-agent under `/dumpster-launch`.
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
    workItemId: QuestWorkItemId;
  }): Promise<AgentPromptResult> =>
    AgentPromptGetResponder({
      agent,
      questId,
      workItemId,
    }),
};
