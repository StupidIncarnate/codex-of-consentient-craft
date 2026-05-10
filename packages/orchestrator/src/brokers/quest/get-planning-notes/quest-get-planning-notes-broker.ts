/**
 * PURPOSE: Returns PathSeeker's phased planningNotes for a quest (full object or a specific section)
 *
 * USAGE:
 * const notes = await questGetPlanningNotesBroker({ questId });
 * // Returns full planningNotes object
 *
 * const scope = await questGetPlanningNotesBroker({ questId, section: 'scope' });
 * // Returns only planningNotes.scopeClassification (may be undefined)
 *
 * WHEN-TO-USE: PathSeeker resume-on-restart — re-read already-committed phase artifacts instead of redoing work.
 */

import { pathJoinAdapter } from '@dungeonmaster/shared/adapters';
import { filePathContract } from '@dungeonmaster/shared/contracts';
import type { Quest, QuestId } from '@dungeonmaster/shared/contracts';
import { locationsStatics } from '@dungeonmaster/shared/statics';

import { questFindQuestPathBroker } from '../find-quest-path/quest-find-quest-path-broker';
import { questLoadBroker } from '../load/quest-load-broker';

type PlanningNotes = Quest['planningNotes'];

export type PlanningNotesSection = 'scope' | 'surface' | 'synthesis' | 'walk' | 'blight';

export type QuestGetPlanningNotesResult =
  | PlanningNotes
  | PlanningNotes['scopeClassification']
  | PlanningNotes['surfaceReports']
  | PlanningNotes['blightReports']
  | PlanningNotes['synthesis']
  | PlanningNotes['walkFindings'];

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

  if (section === 'scope') {
    return notes.scopeClassification;
  }

  if (section === 'surface') {
    return notes.surfaceReports;
  }

  if (section === 'synthesis') {
    return notes.synthesis;
  }

  if (section === 'walk') {
    return notes.walkFindings;
  }

  return notes.blightReports;
};
