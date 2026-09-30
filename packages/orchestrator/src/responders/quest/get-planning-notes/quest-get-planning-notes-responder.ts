/**
 * PURPOSE: Retrieves a quest's planningNotes by delegating to questGetPlanningNotesBroker
 *
 * USAGE:
 * const result = await QuestGetPlanningNotesResponder({ questId: 'add-auth' });
 * // Returns { success: true, data: planningNotes } or { success: false, error }
 */

import { questContract } from '@dungeonmaster/shared/contracts';
import type { Quest } from '@dungeonmaster/shared/contracts';

import { questGetPlanningNotesBroker } from '../../../brokers/quest/get-planning-notes/quest-get-planning-notes-broker';

type PlanningNotes = Quest['planningNotes'];

export type QuestGetPlanningNotesResponderResult =
  | { readonly success: true; readonly data: PlanningNotes }
  | { readonly success: false; readonly error: string };

export const QuestGetPlanningNotesResponder = async ({
  questId,
}: {
  questId: string;
}): Promise<QuestGetPlanningNotesResponderResult> => {
  try {
    const parsedQuestId = questContract.shape.id.parse(questId);
    const data = await questGetPlanningNotesBroker({ questId: parsedQuestId });
    return { success: true, data };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: errorMessage };
  }
};
