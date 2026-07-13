/**
 * PURPOSE: Adapter for StartOrchestrator.getPlanningNotes that wraps the orchestrator package
 *
 * USAGE:
 * const notes = await orchestratorGetQuestPlanningNotesAdapter({ questId });
 * // Returns the quest's planningNotes (full object or the blight section)
 *
 * const blight = await orchestratorGetQuestPlanningNotesAdapter({ questId, section: 'blight' });
 * // Returns blightReports only
 */

import { StartOrchestrator } from '@dungeonmaster/orchestrator';

type Section = 'blight';

export const orchestratorGetQuestPlanningNotesAdapter = async ({
  questId,
  section,
}: {
  questId: string;
  section?: Section;
}): Promise<Awaited<ReturnType<typeof StartOrchestrator.getPlanningNotes>>> =>
  StartOrchestrator.getPlanningNotes({ questId, ...(section !== undefined && { section }) });
