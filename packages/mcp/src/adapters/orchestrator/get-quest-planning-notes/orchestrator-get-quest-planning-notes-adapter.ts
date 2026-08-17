/**
 * PURPOSE: Adapter for StartOrchestrator.getPlanningNotes that wraps the orchestrator package
 *
 * USAGE:
 * const notes = await orchestratorGetQuestPlanningNotesAdapter({ questId });
 * // Returns the quest's planningNotes
 */

import { StartOrchestrator } from '@dungeonmaster/orchestrator';

export const orchestratorGetQuestPlanningNotesAdapter = async ({
  questId,
}: {
  questId: string;
}): Promise<Awaited<ReturnType<typeof StartOrchestrator.getPlanningNotes>>> =>
  StartOrchestrator.getPlanningNotes({ questId });
