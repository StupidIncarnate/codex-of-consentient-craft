/**
 * PURPOSE: Adapter for StartOrchestrator.getAgentPrompt that wraps the orchestrator package
 *
 * USAGE:
 * const augmented = await orchestratorGetAgentPromptAdapter({ agent: 'codeweaver', questId, workItemId });
 * // Returns AgentPromptResult whose prompt has the work-item context block appended
 *
 * const minionPrompt = await orchestratorGetAgentPromptAdapter({ agent: 'worker-minion', questId, discipline: 'implementation' });
 * // Returns AgentPromptResult for a minion, which has no workItemId to derive a discipline from
 */

import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import type { AgentPromptResult } from '@dungeonmaster/orchestrator';
import type { QuestId, QuestWorkItemId } from '@dungeonmaster/shared/contracts';

export const orchestratorGetAgentPromptAdapter = async ({
  agent,
  questId,
  workItemId,
  discipline,
}: {
  agent: string;
  questId: QuestId;
  workItemId?: QuestWorkItemId;
  discipline?: 'implementation' | 'bug-repro' | 'below-browser' | 'browser-e2e' | 'manual-qa';
}): Promise<AgentPromptResult> =>
  StartOrchestrator.getAgentPrompt({
    agent,
    questId,
    ...(workItemId !== undefined && { workItemId }),
    ...(discipline !== undefined && { discipline }),
  });
