/**
 * PURPOSE: Layer helper for spawnBatchLayerBroker — stamps ONE work item `in_progress` with a
 * fresh `startedAt`, refusing the write when the quest itself reads `paused`. The quest's status is
 * read fresh, INSIDE the same questWithModifyLockBroker turn the persist below goes through — never
 * a snapshot taken before the lock — which is the shape questPauseBroker adopted for the mirror
 * image of this race (see that broker's own header). Closes the direction that fix left open: an
 * already-in-flight dispatch's pre-stamp landing AFTER a pause's write must not re-arm a work item
 * pause just reset to pending, which would leave a "ghost running" row ticking a live elapsed
 * duration on a quest the UI reads as paused.
 *
 * USAGE:
 * const { stamped } = await preStampInProgressLayerBroker({ questId, workItemId });
 * // stamped: false means the quest read `paused` inside the lock — the caller must not spawn.
 */

import type { QuestId, QuestWorkItemId } from '@dungeonmaster/shared/contracts';
import {
  fileContentsContract,
  filePathContract,
  questContract,
  workItemContract,
} from '@dungeonmaster/shared/contracts';
import { pathJoinAdapter } from '@dungeonmaster/shared/adapters';
import { isUserPausedQuestStatusGuard } from '@dungeonmaster/shared/guards';
import { locationsStatics } from '@dungeonmaster/shared/statics';

import { questFindQuestPathBroker } from '../find-quest-path/quest-find-quest-path-broker';
import { questLoadBroker } from '../load/quest-load-broker';
import { questPersistBroker } from '../persist/quest-persist-broker';
import { questWithModifyLockBroker } from '../with-modify-lock/quest-with-modify-lock-broker';

const JSON_INDENT_SPACES = 2;

export const preStampInProgressLayerBroker = async ({
  questId,
  workItemId,
}: {
  questId: QuestId;
  workItemId: QuestWorkItemId;
}): Promise<{ stamped: boolean }> =>
  questWithModifyLockBroker({
    questId,
    run: async (): Promise<{ stamped: boolean }> => {
      const { questPath } = await questFindQuestPathBroker({ questId });
      const questFilePath = filePathContract.parse(
        pathJoinAdapter({ paths: [questPath, locationsStatics.quest.questFile] }),
      );
      const quest = await questLoadBroker({ questFilePath });

      // Read from the quest as loaded for THIS write, inside the same lock the persist goes
      // through. A pause that landed while this dispatch was already in flight has reset the item
      // to pending, and stamping over that reading leaves a "ghost running" row on a paused quest.
      if (isUserPausedQuestStatusGuard({ status: quest.status })) {
        return { stamped: false };
      }

      const nextWorkItems = quest.workItems.map((workItem) =>
        workItem.id === workItemId
          ? workItemContract.parse({
              ...workItem,
              status: 'in_progress',
              startedAt: new Date().toISOString(),
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

      return { stamped: true };
    },
  });
