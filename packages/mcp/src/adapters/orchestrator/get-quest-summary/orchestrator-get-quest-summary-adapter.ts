/**
 * PURPOSE: Adapter for StartOrchestrator.getQuestSummary that wraps the orchestrator package
 *
 * USAGE:
 * const summary = await orchestratorGetQuestSummaryAdapter({ questId });
 * // Returns the QuestSummary STRUCTURE — per-flow/per-track coverage, mid-quest observables,
 * // unconfirmable verdicts and the note groups. Rendering it is the layer responder's job.
 */

import { StartOrchestrator } from '@dungeonmaster/orchestrator';

export const orchestratorGetQuestSummaryAdapter = async ({
  questId,
}: {
  questId: string;
}): Promise<Awaited<ReturnType<typeof StartOrchestrator.getQuestSummary>>> =>
  StartOrchestrator.getQuestSummary({ questId });
