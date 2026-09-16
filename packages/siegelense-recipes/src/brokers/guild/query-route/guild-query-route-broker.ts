/**
 * PURPOSE: The guild ingredient's `query` route — lists every registered guild, then narrows to
 * the ones matching `where`. Reach for `StartOrchestrator.listGuilds` rather than
 * `guildConfigReadBroker`/`guildListBroker` directly: neither is exported from
 * `@dungeonmaster/orchestrator` (confirmed absent from its `src/index.ts`), so this is the one
 * reachable path to the same data. `GuildListItem` is `guildContract` extended with `valid` and
 * `questCount` — a superset, so a caller re-parsing a row through `guildContract` (this
 * ingredient's own `record`) drops the two extra fields rather than rejecting the row.
 *
 * USAGE:
 * await guildQueryRouteBroker({ target, where: {} });
 * // Returns every registered guild
 * await guildQueryRouteBroker({ target, where: { name: 'Guild 1' } });
 * // Returns only guilds named 'Guild 1'
 */
import { StartOrchestrator } from '@dungeonmaster/orchestrator';
import type { GuildListItem } from '@dungeonmaster/shared/contracts';

import { matchesWhereClauseGuard } from '../../../guards/matches-where-clause/matches-where-clause-guard';
import type { DmTarget } from '../../../contracts/dm-target/dm-target-contract';

export const guildQueryRouteBroker = async ({
  where,
}: {
  target: DmTarget;
  where: Record<string, unknown>;
}): Promise<GuildListItem[]> => {
  const guilds = await StartOrchestrator.listGuilds();

  return guilds.filter((guild) => matchesWhereClauseGuard({ record: guild, where }));
};
