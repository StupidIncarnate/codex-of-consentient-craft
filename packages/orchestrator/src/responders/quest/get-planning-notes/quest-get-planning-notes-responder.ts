/**
 * PURPOSE: Retrieves a quest's planningNotes (full object or the blight section) by delegating to questGetPlanningNotesBroker
 *
 * USAGE:
 * const result = await QuestGetPlanningNotesResponder({ questId: 'add-auth' });
 * // Returns { success: true, data: planningNotes } or { success: false, error }
 *
 * const blight = await QuestGetPlanningNotesResponder({ questId: 'add-auth', section: 'blight' });
 * // Returns { success: true, data: blightReports } or { success: false, error }
 */

import { errorMessageContract, questIdContract } from '@dungeonmaster/shared/contracts';
import type { ErrorMessage, Quest } from '@dungeonmaster/shared/contracts';

import { questGetPlanningNotesBroker } from '../../../brokers/quest/get-planning-notes/quest-get-planning-notes-broker';

type PlanningNotes = Quest['planningNotes'];

type PlanningNotesSection = 'blight';

type PlanningNotesData = PlanningNotes | PlanningNotes['blightReports'];

export type QuestGetPlanningNotesResponderResult =
  | { readonly success: true; readonly data: PlanningNotesData }
  | { readonly success: false; readonly error: ErrorMessage };

export const QuestGetPlanningNotesResponder = async ({
  questId,
  section,
}: {
  questId: string;
  section?: PlanningNotesSection;
}): Promise<QuestGetPlanningNotesResponderResult> => {
  try {
    const parsedQuestId = questIdContract.parse(questId);
    const data = await questGetPlanningNotesBroker({
      questId: parsedQuestId,
      ...(section !== undefined && { section }),
    });
    return { success: true, data };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: errorMessageContract.parse(errorMessage) };
  }
};
