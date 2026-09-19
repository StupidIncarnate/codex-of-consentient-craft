/**
 * PURPOSE: The quest ingredient's `query` route — lists every quest under a guild, then narrows
 * to the ones matching `where`. Reach for `questListBroker` directly, BY PATH from the
 * orchestrator's `/brokers` subpath rather than through the main `.` barrel — importing anything
 * from `.` evaluates `startup/start-orchestrator.ts`, which boots a rate-limits watcher and a
 * stale-process watchdog at module scope, and this package is a short-lived hydration tool, not
 * the long-running server those exist for. It returns `Quest[]` — an exact match for this
 * ingredient's own `record` contract, unlike `guildListBroker`'s decorated `GuildListItem`.
 *
 * `where` must carry `guildId`: a quest's parent is its FOLDER, not a field on the record (a
 * quest never carries `guildId` at all), so the only way to know which guild's quests to list is
 * the link value the caller's `where` supplies.
 *
 * USAGE:
 * await questQueryRouteBroker({ target, where: { guildId: 'f47ac10b-…' } });
 * // Returns every quest under that guild
 * await questQueryRouteBroker({ target, where: { guildId: 'f47ac10b-…', title: 'Quest 2' } });
 * // Returns only the matching quest
 */
import { questListBroker } from '@dungeonmaster/orchestrator/brokers';
import { guildIdContract } from '@dungeonmaster/shared/contracts';
import type { Quest } from '@dungeonmaster/shared/contracts';

import { matchesWhereClauseGuard } from '../../../guards/matches-where-clause/matches-where-clause-guard';
import type { DmTarget } from '../../../contracts/dm-target/dm-target-contract';

export const questQueryRouteBroker = async ({
  where,
}: {
  target: DmTarget;
  where: Record<string, unknown>;
}): Promise<Quest[]> => {
  const { guildId, ...rest } = where;
  const quests = await questListBroker({ guildId: guildIdContract.parse(guildId) });

  return quests.filter((quest) => matchesWhereClauseGuard({ record: quest, where: rest }));
};
