/**
 * PURPOSE: Shared quest-execution discovery — loads every valid guild's quests from disk and
 * returns the FIFO-ordered (oldest `createdAt` first) list of quests that are in the execution
 * queue — `in_progress` (actively executing) OR `paused` (user-paused but still queued) — each
 * paired with its guild context. This is the SINGLE discovery both the execution queue
 * and the dispatcher share: `/queue` (ExecutionQueueGetAllResponder) renders the whole array, and
 * `questGetNextStepBroker` dispatches the head. There is no in-memory or JSON-file queue — every
 * call re-reads the quest JSONs on disk, so a quest that started (or a higher-priority one that just
 * arrived) is judged fresh on the next pass, not from a stale cached list. Per-guild load failures
 * are isolated so one broken guild can't blank the scan.
 *
 * USAGE:
 * const entries = await questActiveQuestsBroker();
 * // Returns: ActiveQuestEntry[] — FIFO by quest.createdAt (head first). Empty when nothing runs.
 */

import {
  isActivelyExecutingQuestStatusGuard,
  isUserPausedQuestStatusGuard,
} from '@dungeonmaster/shared/guards';
import { nameToUrlSlugTransformer } from '@dungeonmaster/shared/transformers';

import type { ActiveQuestEntry } from '../../../contracts/active-quest-entry/active-quest-entry-contract';
import { guildListBroker } from '../../guild/list/guild-list-broker';
import { questListBroker } from '../list/quest-list-broker';

export const questActiveQuestsBroker = async (): Promise<ActiveQuestEntry[]> => {
  const guilds = await guildListBroker();
  const perGuild = await Promise.all(
    guilds
      .filter((g) => g.valid)
      .map(async (g): Promise<ActiveQuestEntry[]> => {
        try {
          const quests = await questListBroker({ guildId: g.id });
          const guildSlug = g.urlSlug ?? nameToUrlSlugTransformer({ name: g.name });
          return quests
            .filter(
              (q) =>
                isActivelyExecutingQuestStatusGuard({ status: q.status }) ||
                isUserPausedQuestStatusGuard({ status: q.status }),
            )
            .map((quest) => ({ quest, guildId: g.id, guildSlug }));
        } catch {
          return [] as ActiveQuestEntry[];
        }
      }),
  );

  // FIFO by createdAt — ISO-8601 timestamps sort lexicographically. The head is the quest
  // questGetNextStepBroker dispatches; /queue renders the whole array in this same order.
  return perGuild
    .flat()
    .sort((a, b) => String(a.quest.createdAt).localeCompare(String(b.quest.createdAt)));
};
