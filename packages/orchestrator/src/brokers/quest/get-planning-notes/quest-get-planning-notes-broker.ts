/**
 * PURPOSE: Loads a quest's whole `planningNotes` object off disk. Reach for this over `get-quest`
 * when the caller wants the plan/ledger side channel without paying for the spec: an operator
 * reads back the plan a planning sub-agent persisted here, rather than reconstructing it from
 * scratch.
 *
 * USAGE:
 * const notes = await questGetPlanningNotesBroker({ questId });
 * // Returns { blightLedger, questNotes, operationPlans }
 */

import type { Quest } from '@dungeonmaster/shared/contracts';
import { locationsStatics } from '@dungeonmaster/shared/statics';
import { join } from '#gateway/node/path';

import { questFindQuestPathBroker } from '../find-quest-path/quest-find-quest-path-broker';
import { questLoadBroker } from '../load/quest-load-broker';

export type QuestGetPlanningNotesResult = Quest['planningNotes'];

export const questGetPlanningNotesBroker = async ({
  questId,
}: {
  questId: Quest['id'];
}): Promise<QuestGetPlanningNotesResult> => {
  const { questPath } = await questFindQuestPathBroker({ questId });

  const questFilePath = join(questPath, locationsStatics.quest.questFile);

  const quest = await questLoadBroker({ questFilePath });

  return quest.planningNotes;
};
