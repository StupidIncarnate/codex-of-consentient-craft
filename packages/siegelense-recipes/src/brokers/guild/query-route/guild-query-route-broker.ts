/**
 * PURPOSE: The guild ingredient's `query` route — lists every registered guild, then narrows to
 * the ones matching `where`. Reach for `guildListBroker` (the orchestrator's `/brokers` subpath)
 * rather than `guildConfigReadBroker` directly: the latter is internal, absent from every
 * orchestrator export surface. `guildListBroker` is reached BY PATH rather than through the main
 * `@dungeonmaster/orchestrator` barrel: importing anything from that barrel evaluates
 * `startup/start-orchestrator.ts`, which boots a rate-limits watcher and a stale-process watchdog
 * at module scope — fine for the long-running server, fatal for a short-lived command that then
 * never exits. `GuildListItem` is `guildContract` extended with `valid` and `questCount` — a
 * superset, so a caller re-parsing a row through `guildContract` (this ingredient's own `record`)
 * drops the two extra fields rather than rejecting the row.
 *
 * USAGE:
 * await guildQueryRouteBroker({ target, where: {} });
 * // Returns every registered guild
 * await guildQueryRouteBroker({ target, where: { name: 'Guild 1' } });
 * // Returns only guilds named 'Guild 1'
 */
import { guildListBroker } from '@dungeonmaster/orchestrator/brokers';
import type { GuildListItem } from '@dungeonmaster/shared/contracts';

import { matchesWhereClauseGuard } from '../../../guards/matches-where-clause/matches-where-clause-guard';
import type { DmTarget } from '../../../contracts/dm-target/dm-target-contract';

export const guildQueryRouteBroker = async ({
  where,
}: {
  target: DmTarget;
  where: Record<string, unknown>;
}): Promise<GuildListItem[]> => {
  const guilds = await guildListBroker();

  return guilds.filter((guild) => matchesWhereClauseGuard({ record: guild, where }));
};
