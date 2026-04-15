/**
 * PURPOSE: Adapter for StartOrchestrator.getPlanningNotes that wraps the orchestrator package
 *
 * USAGE:
 * const notes = await orchestratorGetPlanningNotesAdapter({ questId });
 * // Returns PathSeeker's planningNotes for the quest (full object or section slice)
 *
 * const scope = await orchestratorGetPlanningNotesAdapter({ questId, section: 'scope' });
 * // Returns scopeClassification only
 */

import { StartOrchestrator } from '@dungeonmaster/orchestrator';

type Section = 'scope' | 'surface' | 'synthesis' | 'walk' | 'review';

export const orchestratorGetPlanningNotesAdapter = async ({
  questId,
  section,
}: {
  questId: string;
  section?: Section;
}): Promise<Awaited<ReturnType<typeof StartOrchestrator.getPlanningNotes>>> =>
  StartOrchestrator.getPlanningNotes({ questId, ...(section !== undefined && { section }) });
