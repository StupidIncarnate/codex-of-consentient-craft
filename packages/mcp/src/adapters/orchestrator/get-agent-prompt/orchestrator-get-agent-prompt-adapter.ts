/**
 * PURPOSE: Adapter for StartOrchestrator.getAgentPrompt that wraps the orchestrator package
 *
 * USAGE:
 * const augmented = await orchestratorGetAgentPromptAdapter({ agent: 'codeweaver', questId, workItemId });
 * // Returns AgentPromptResult whose prompt has the work-item context block appended
 *
 * const minionPrompt = await orchestratorGetAgentPromptAdapter({ agent: 'codeweaver-reviewer', questId });
 * // Returns AgentPromptResult for a minion, which has no work item of its own
 */

import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import type { AgentPromptResult } from '@dungeonmaster/orchestrator';
import type { QuestId, QuestWorkItemId } from '@dungeonmaster/shared/contracts';

export const orchestratorGetAgentPromptAdapter = async ({
  agent,
  questId,
  workItemId,
}: {
  agent: string;
  questId: QuestId;
  workItemId?: QuestWorkItemId;
}): Promise<AgentPromptResult> =>
  StartOrchestrator.getAgentPrompt({
    agent,
    questId,
    ...(workItemId !== undefined && { workItemId }),
  });
