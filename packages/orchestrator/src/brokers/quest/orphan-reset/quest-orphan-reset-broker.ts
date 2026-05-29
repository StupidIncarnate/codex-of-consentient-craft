/**
 * PURPOSE: Resets orphaned in_progress work items across every startable/in-progress quest by mutating them back to pending so the next dispatch re-runs them.
 *
 * USAGE:
 * const result = await questOrphanResetBroker({ excludeSessionId: 'abc-123' });
 * // Returns: { orphansReset: OrphansResetCount } — total work items reset across all guilds/quests
 *
 * WHEN-TO-USE: From `questMonitorWatcherStartBroker` whenever the quest-driven watcher
 *   reactor first observes a parent sessionId on an active workItem. The prior
 *   /dumpster-launch may have died mid-flight, leaving `in_progress` items that need to
 *   drop back to `pending` so the new launcher's `get-next-step` re-dispatches them.
 *   Idempotent: subsequent calls find nothing to reset.
 * WHEN-NOT-TO-USE: From any per-quest path — this walks every guild every call. For a
 *   single-quest reset prefer `quest-pause-broker` / `quest-resume-broker`.
 *
 * SAFETY: Pass `excludeSessionId` to preserve workItems stamped against a known-live
 *   parent session. The quest-driven watcher invokes this with the sessionId that just
 *   triggered the watcher start, so the stamp that opened the door isn't immediately
 *   wiped by the reset that walks through it. Without the exclusion the reactor falls
 *   into a stamp → start → reset → stop oscillation.
 */

import { modifyQuestInputContract, type SessionId } from '@dungeonmaster/shared/contracts';
import type { Quest } from '@dungeonmaster/shared/contracts';
import {
  isActiveWorkItemStatusGuard,
  isAnyAgentRunningQuestStatusGuard,
  isStartableQuestStatusGuard,
} from '@dungeonmaster/shared/guards';

import {
  orphanResetResultContract,
  type OrphanResetResult,
} from '../../../contracts/orphan-reset-result/orphan-reset-result-contract';
import { guildListBroker } from '../../guild/list/guild-list-broker';
import { questListBroker } from '../list/quest-list-broker';
import { questModifyBroker } from '../modify/quest-modify-broker';

export const questOrphanResetBroker = async ({
  excludeSessionId,
}: {
  excludeSessionId?: SessionId;
} = {}): Promise<OrphanResetResult> => {
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
              isAnyAgentRunningQuestStatusGuard({ status: quest.status }),
          );
        } catch {
          return [] as Quest[];
        }
      }),
  );

  const registrableQuests = perGuildQuests.flat();

  const orphanedTotals = await Promise.all(
    registrableQuests.map(async (quest) => {
      const orphanedItems = quest.workItems.filter((wi) => {
        if (!isActiveWorkItemStatusGuard({ status: wi.status })) return false;
        if (excludeSessionId !== undefined && wi.sessionId === excludeSessionId) return false;
        return true;
      });
      if (orphanedItems.length === 0) {
        return 0;
      }

      const resetInput = modifyQuestInputContract.parse({
        questId: quest.id,
        workItems: orphanedItems.map((wi) => ({
          id: wi.id,
          status: 'pending' as const,
          // Clear per-run identity. Stale realAgentId/parentSessionId stamped from a
          // prior /dumpster-launch attempt is misleading once the item is pending again;
          // the next dispatch's get-agent-prompt call re-stamps fresh values. Null is the
          // documented clear marker on workItemForUpsertContract.
          sessionId: null,
          agentId: null,
          startedAt: null,
        })),
      });

      await questModifyBroker({ input: resetInput });
      return orphanedItems.length;
    }),
  );

  const orphansReset = orphanedTotals.reduce((sum, n) => sum + n, 0);

  return orphanResetResultContract.parse({ orphansReset });
};
