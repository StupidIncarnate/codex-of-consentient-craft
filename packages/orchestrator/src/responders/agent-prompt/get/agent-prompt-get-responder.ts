/**
 * PURPOSE: Resolves an agent name (plus questId and workItemId) to its prompt data via agentPromptGetBroker.
 * Used by StartOrchestrator.getAgentPrompt to surface the broker to the MCP package.
 *
 * USAGE:
 * const augmented = await AgentPromptGetResponder({ agent: 'codeweaver', questId, workItemId });
 * // Returns AgentPromptResult { name, model, prompt }
 */

import type { AgentPromptResult, QuestId, QuestWorkItemId } from '@dungeonmaster/shared/contracts';

import { agentPromptGetBroker } from '../../../brokers/agent-prompt/get/agent-prompt-get-broker';

export const AgentPromptGetResponder = async ({
  agent,
  questId,
  workItemId,
}: {
  agent: string;
  questId: QuestId;
  workItemId: QuestWorkItemId;
}): Promise<AgentPromptResult> =>
  agentPromptGetBroker({
    agent,
    questId,
    workItemId,
  });
