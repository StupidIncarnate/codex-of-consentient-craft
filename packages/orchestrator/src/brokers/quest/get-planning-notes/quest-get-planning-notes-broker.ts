/**
 * PURPOSE: Returns a quest's planningNotes (full object or the blight section)
 *
 * USAGE:
 * const notes = await questGetPlanningNotesBroker({ questId });
 * // Returns full planningNotes object
 *
 * const blight = await questGetPlanningNotesBroker({ questId, section: 'blight' });
 * // Returns only planningNotes.blightReports
 *
 * WHEN-TO-USE: Blightwarden synthesizer reads the minions' blight reports mid-run.
 */

import { pathJoinAdapter } from '@dungeonmaster/shared/adapters';
import { filePathContract } from '@dungeonmaster/shared/contracts';
import type { Quest, QuestId } from '@dungeonmaster/shared/contracts';
import { locationsStatics } from '@dungeonmaster/shared/statics';

import { questFindQuestPathBroker } from '../find-quest-path/quest-find-quest-path-broker';
import { questLoadBroker } from '../load/quest-load-broker';

type PlanningNotes = Quest['planningNotes'];

export type PlanningNotesSection = 'blight';

export type QuestGetPlanningNotesResult = PlanningNotes | PlanningNotes['blightReports'];

export const questGetPlanningNotesBroker = async ({
  questId,
  section,
}: {
  questId: QuestId;
  section?: PlanningNotesSection;
}): Promise<QuestGetPlanningNotesResult> => {
  const { questPath } = await questFindQuestPathBroker({ questId });

  const questFilePath = filePathContract.parse(
    pathJoinAdapter({ paths: [questPath, locationsStatics.quest.questFile] }),
  );

  const quest = await questLoadBroker({ questFilePath });
  const notes = quest.planningNotes;

  if (section === undefined) {
    return notes;
  }

  return notes.blightReports;
};
