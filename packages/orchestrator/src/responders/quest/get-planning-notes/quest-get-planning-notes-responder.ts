/**
 * PURPOSE: Retrieves PathSeeker planningNotes for a quest by delegating to questGetPlanningNotesBroker
 *
 * USAGE:
 * const notes = await QuestGetPlanningNotesResponder({ questId: 'add-auth' });
 * // Returns the planning-notes empty-shape stub until real impl lands
 */

import { questGetPlanningNotesBroker } from '../../../brokers/quest/get-planning-notes/quest-get-planning-notes-broker';
import type { QuestGetPlanningNotesResult } from '../../../brokers/quest/get-planning-notes/quest-get-planning-notes-broker';

export const QuestGetPlanningNotesResponder = async ({
  questId,
}: {
  questId: string;
}): Promise<QuestGetPlanningNotesResult> => questGetPlanningNotesBroker({ questId });
