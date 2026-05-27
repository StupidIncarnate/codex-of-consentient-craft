/**
 * PURPOSE: Adapter for StartOrchestrator.getAgentPrompt that wraps the orchestrator package
 *
 * USAGE:
 * const augmented = await orchestratorGetAgentPromptAdapter({ agent: 'codeweaver', questId, workItemId });
 * // Returns AgentPromptResult whose prompt has the work-item context block appended
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
  workItemId: QuestWorkItemId;
}): Promise<AgentPromptResult> =>
  StartOrchestrator.getAgentPrompt({
    agent,
    questId,
    workItemId,
  });
