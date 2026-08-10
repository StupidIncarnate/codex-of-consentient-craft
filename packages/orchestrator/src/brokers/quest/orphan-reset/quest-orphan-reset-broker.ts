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
 *
 * FRESHNESS: the guild/quest walk above is only a candidate filter. Which items are
 *   actually orphaned — and therefore what gets written — is decided from the quest loaded
 *   INSIDE its own modify lock, because the walk reads every quest.json under the
 *   dungeonmaster home and on a home holding many quests it takes long enough that a work
 *   item can be dispatched, stamped with its session and signalled complete while the walk
 *   is still running. Deciding from the walk's snapshot and blind-writing the result puts a
 *   `complete` item back to `pending` with its identity cleared, and the dispatcher then
 *   re-runs a session that already signalled.
 */

import { workItemContract, type SessionId } from '@dungeonmaster/shared/contracts';
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
import { questOperationsUpdateBroker } from '../operations-update/quest-operations-update-broker';

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
    registrableQuests.map(async (candidate) => {
      const hasCandidateOrphan = candidate.workItems.some(
        (wi) =>
          isActiveWorkItemStatusGuard({ status: wi.status }) &&
          (excludeSessionId === undefined || wi.sessionId !== excludeSessionId),
      );
      if (!hasCandidateOrphan) {
        return 0;
      }

      // Assigned inside the update callback, which TypeScript's flow analysis cannot see —
      // an object holder is what carries the count back out.
      const resetCount = { value: 0 };

      try {
        await questOperationsUpdateBroker({
          questId: candidate.id,
          update: ({ quest }) => {
            const orphanedIds = new Set(
              quest.workItems
                .filter(
                  (wi) =>
                    isActiveWorkItemStatusGuard({ status: wi.status }) &&
                    (excludeSessionId === undefined || wi.sessionId !== excludeSessionId),
                )
                .map((wi) => wi.id),
            );
            if (orphanedIds.size === 0) {
              return null;
            }
            resetCount.value = orphanedIds.size;

            return {
              workItems: quest.workItems.map((wi) => {
                if (!orphanedIds.has(wi.id)) {
                  return wi;
                }
                // Clear per-run identity. Stale realAgentId/parentSessionId stamped from a
                // prior /dumpster-launch attempt is misleading once the item is pending
                // again; the next dispatch's get-agent-prompt call re-stamps fresh values.
                const reset: Record<PropertyKey, unknown> = { ...wi, status: 'pending' };
                Reflect.deleteProperty(reset, 'sessionId');
                Reflect.deleteProperty(reset, 'agentId');
                Reflect.deleteProperty(reset, 'startedAt');
                return workItemContract.parse(reset);
              }),
            };
          },
        });
      } catch (error: unknown) {
        // One quest's reset must not abort the sweep across every other guild and quest —
        // but a reset that keeps failing is why a crashed agent never comes back, so it is
        // logged rather than swallowed.
        process.stderr.write(
          `[quest-orphan-reset] reset failed for quest ${candidate.id}: ${String(error)}\n`,
        );
        return 0;
      }

      return resetCount.value;
    }),
  );

  const orphansReset = orphanedTotals.reduce((sum, n) => sum + n, 0);

  return orphanResetResultContract.parse({ orphansReset });
};
