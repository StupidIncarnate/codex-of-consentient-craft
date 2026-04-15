/**
 * PURPOSE: Adapter for StartOrchestrator.getPlanningNotes that wraps the orchestrator package
 *
 * USAGE:
 * const notes = await orchestratorGetPlanningNotesAdapter({ questId });
 * // Returns PathSeeker's planningNotes for the quest (scaffold stub returns empty shape)
 */

import { StartOrchestrator } from '@dungeonmaster/orchestrator';

export const orchestratorGetPlanningNotesAdapter = async ({
  questId,
}: {
  questId: string;
}): Promise<Awaited<ReturnType<typeof StartOrchestrator.getPlanningNotes>>> =>
  StartOrchestrator.getPlanningNotes({ questId });
