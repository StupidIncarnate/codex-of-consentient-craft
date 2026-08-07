/**
 * PURPOSE: Adapter for StartOrchestrator.getQuestSummary that wraps the orchestrator package
 *
 * USAGE:
 * const summary = await orchestratorGetQuestSummaryAdapter({ questId });
 * // Returns: QuestSummary — per-flow/per-track coverage, mid-quest observables, unconfirmable
 * // verdicts and the note groups — or throws when the quest cannot be found
 */

import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import type { QuestSummary } from '@dungeonmaster/shared/contracts';

export const orchestratorGetQuestSummaryAdapter = async ({
  questId,
}: {
  questId: string;
}): Promise<QuestSummary> => StartOrchestrator.getQuestSummary({ questId });
