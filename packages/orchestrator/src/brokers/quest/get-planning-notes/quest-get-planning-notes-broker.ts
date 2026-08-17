/**
 * PURPOSE: Loads a quest's whole `planningNotes` object off disk. Reach for this over `get-quest`
 * when the caller wants the plan/ledger side channel without paying for the spec: an operation
 * orchestrator reads back the plan its `planner-minion` persisted here, never having opened a
 * source file itself.
 *
 * USAGE:
 * const notes = await questGetPlanningNotesBroker({ questId });
 * // Returns { blightLedger, questNotes, operationPlans }
 */

import { pathJoinAdapter } from '@dungeonmaster/shared/adapters';
import { filePathContract } from '@dungeonmaster/shared/contracts';
import type { Quest, QuestId } from '@dungeonmaster/shared/contracts';
import { locationsStatics } from '@dungeonmaster/shared/statics';

import { questFindQuestPathBroker } from '../find-quest-path/quest-find-quest-path-broker';
import { questLoadBroker } from '../load/quest-load-broker';

export type QuestGetPlanningNotesResult = Quest['planningNotes'];

export const questGetPlanningNotesBroker = async ({
  questId,
}: {
  questId: QuestId;
}): Promise<QuestGetPlanningNotesResult> => {
  const { questPath } = await questFindQuestPathBroker({ questId });

  const questFilePath = filePathContract.parse(
    pathJoinAdapter({ paths: [questPath, locationsStatics.quest.questFile] }),
  );

  const quest = await questLoadBroker({ questFilePath });

  return quest.planningNotes;
};
