/**
 * PURPOSE: Records the lane the router just started onto ONE work item's `payload.instance`, under
 * the quest's own modify lock — the persist half of the router's lane lifecycle, kept as its own
 * turn so the write lands exactly where `get-quest-work` and `workItemToPromptTransformer` already
 * read it (`workItem.payload.instance`, in `questWorkInstanceContract`'s shape).
 *
 * `questPath` arrives as a PARAMETER rather than being re-resolved here through
 * `questFindQuestPathBroker`. `laneProvisionBatchBroker` already resolves it once, for the whole
 * batch, to get the guildId a lane's `start` call needs — a second, independent resolution inside
 * this broker would cost a real fs walk per lane in production, and in a test using this broker
 * alongside that OTHER resolution it gives nothing to key the two calls apart by: both would
 * describe an identical `questFindQuestPathBroker({questId})` call, and
 * `pathJoinAdapterProxy`'s staging is a call-ordered queue, not argument-addressed — two
 * independent resolutions interleaved with unrelated calls desynchronise it.
 *
 * Reads the quest FRESH, inside the lock, the same shape `preStampInProgressLayerBroker` uses for
 * the mirror-image write — never a snapshot taken before the lock, so a concurrent mutation to this
 * SAME work item cannot be overwritten by a stale read.
 *
 * USAGE:
 * await laneRecordInstanceBroker({ questId, questPath, workItemId, instance });
 * // Persists workItem.payload = { ...workItem.payload, instance } and returns that instance
 */

import { pathJoinAdapter } from '@dungeonmaster/shared/adapters';
import {
  fileContentsContract,
  filePathContract,
  questContract,
  workItemContract,
} from '@dungeonmaster/shared/contracts';
import type { AbsoluteFilePath, QuestId, QuestWorkItemId } from '@dungeonmaster/shared/contracts';
import { locationsStatics } from '@dungeonmaster/shared/statics';

import type { QuestWorkInstance } from '../../../contracts/quest-work-instance/quest-work-instance-contract';
import { questLoadBroker } from '../../quest/load/quest-load-broker';
import { questPersistBroker } from '../../quest/persist/quest-persist-broker';
import { questWithModifyLockBroker } from '../../quest/with-modify-lock/quest-with-modify-lock-broker';

const JSON_INDENT_SPACES = 2;

export const laneRecordInstanceBroker = async ({
  questId,
  questPath,
  workItemId,
  instance,
}: {
  questId: QuestId;
  questPath: AbsoluteFilePath;
  workItemId: QuestWorkItemId;
  instance: QuestWorkInstance;
}): Promise<QuestWorkInstance> =>
  questWithModifyLockBroker({
    questId,
    run: async (): Promise<QuestWorkInstance> => {
      const questFilePath = filePathContract.parse(
        pathJoinAdapter({ paths: [questPath, locationsStatics.quest.questFile] }),
      );
      const quest = await questLoadBroker({ questFilePath });

      const nextWorkItems = quest.workItems.map((workItem) =>
        workItem.id === workItemId
          ? workItemContract.parse({
              ...workItem,
              payload: { ...(workItem.payload ?? {}), instance },
            })
          : workItem,
      );

      const mutated = questContract.parse({
        ...quest,
        workItems: nextWorkItems,
        updatedAt: new Date().toISOString(),
      });

      const questJson = fileContentsContract.parse(
        JSON.stringify(mutated, null, JSON_INDENT_SPACES),
      );
      await questPersistBroker({ questFilePath, contents: questJson, questId });

      return instance;
    },
  });
