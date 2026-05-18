/**
 * PURPOSE: Resets orphaned in_progress work items across every startable/in-progress quest by mutating them back to pending. Called when a fresh /dumpster-launch monitor session is announced and the prior launcher's in-flight work items must be re-dispatched
 *
 * USAGE:
 * const result = await questOrphanResetBroker();
 * // Returns: { orphansReset: OrphansResetCount } — total work items reset across all guilds/quests
 *
 * WHEN-TO-USE: From the HTTP server's monitor-session-watch reactor whenever a new
 *   `active-monitor-session.json` parentSessionId is observed. The prior /dumpster-launch
 *   may have died mid-flight, leaving `in_progress` work items that need to drop back to
 *   `pending` so the new launcher's `get-next-step` re-dispatches them.
 * WHEN-NOT-TO-USE: From any per-quest path — this walks every guild every call. For a
 *   single-quest reset prefer `quest-pause-broker` / `quest-resume-broker`.
 */

import { modifyQuestInputContract } from '@dungeonmaster/shared/contracts';
import type { Quest } from '@dungeonmaster/shared/contracts';
import {
  isActivelyExecutingQuestStatusGuard,
  isActiveWorkItemStatusGuard,
  isStartableQuestStatusGuard,
} from '@dungeonmaster/shared/guards';

import {
  orphanResetResultContract,
  type OrphanResetResult,
} from '../../../contracts/orphan-reset-result/orphan-reset-result-contract';
import { guildListBroker } from '../../guild/list/guild-list-broker';
import { questListBroker } from '../list/quest-list-broker';
import { questModifyBroker } from '../modify/quest-modify-broker';

export const questOrphanResetBroker = async (): Promise<OrphanResetResult> => {
  const guilds = await guildListBroker();

  const perGuildQuests = await Promise.all(
    guilds
      .filter((guildItem) => guildItem.valid)
      .map(async (guildItem) => {
        try {
          const quests = await questListBroker({ guildId: guildItem.id });
          return quests.filter(
            (quest: Quest) =>
              isStartableQuestStatusGuard({ status: quest.status }) ||
              isActivelyExecutingQuestStatusGuard({ status: quest.status }),
          );
        } catch {
          return [] as Quest[];
        }
      }),
  );

  const registrableQuests = perGuildQuests.flat();

  const orphanedTotals = await Promise.all(
    registrableQuests.map(async (quest) => {
      const orphanedItems = quest.workItems.filter((wi) =>
        isActiveWorkItemStatusGuard({ status: wi.status }),
      );
      if (orphanedItems.length === 0) {
        return 0;
      }

      const resetInput = modifyQuestInputContract.parse({
        questId: quest.id,
        workItems: orphanedItems.map((wi) => ({
          id: wi.id,
          status: 'pending' as const,
        })),
      });

      await questModifyBroker({ input: resetInput });
      return orphanedItems.length;
    }),
  );

  const orphansReset = orphanedTotals.reduce((sum, n) => sum + n, 0);

  return orphanResetResultContract.parse({ orphansReset });
};
