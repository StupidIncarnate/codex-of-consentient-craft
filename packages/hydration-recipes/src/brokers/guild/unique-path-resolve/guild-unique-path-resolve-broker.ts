/**
 * PURPOSE: Bumps a guild's default path fragment to the next free "-N" suffix when the target
 * already holds a directory at the derived absolute path — the DEF-78 fix for composing recipes:
 * every recipe's own `add()` call starts its own `defaults(index)` at index 0, so composing two
 * guild recipes (or seeding `guild-empty` twice) into ONE target always mints the identical
 * literal fragment `guilds-under-test/guild-1` for both, and the second write collides with the
 * first — `guildAddBroker` answers a repeat with `A guild with path ... already exists`. Reach for
 * this from both the `write` and `api` routes, before either derives the absolute path it
 * registers.
 *
 * DETERMINISTIC, not random: it reads the REAL FILESYSTEM STATE the target already holds (does a
 * directory exist at the candidate absolute path?) and increments the trailing number until one is
 * free — the same starting state always produces the same next index, and a ROUTE is allowed this
 * kind of I/O even though an ingredient's own `defaults(index)` never is
 * (`packages/hydration/CLAUDE.md`'s "Determinism is structural" section binds the INGREDIENT, not
 * the route that runs after it — the same distinction that already lets `guildAddBroker` mint an
 * id via `crypto.randomUUID()`).
 *
 * Recurses on ITSELF rather than a private helper — `guildDefaultPathBumpTransformer` returning the
 * path UNCHANGED for a shape it does not recognise is what lets this loop tell "not a default
 * fragment" apart from "still occupied" with one equality check, so a caller's explicit custom path
 * is returned untouched, colliding or not, exactly as every other route in this package leaves an
 * explicit value alone.
 *
 * USAGE:
 * guildUniquePathResolveBroker({ target, path: guildPathContract.parse('guilds-under-test/guild-1') });
 * // Returns 'guilds-under-test/guild-2' when guild-1's directory already exists under target.home,
 * // else the original path unchanged
 */
import { existsSync } from '#gateway/node/fs';

import { guildDefaultPathBumpTransformer } from '../../../transformers/guild-default-path-bump/guild-default-path-bump-transformer';
import { guildPathDeriveTransformer } from '../../../transformers/guild-path-derive/guild-path-derive-transformer';
import type { DmTarget } from '../../../contracts/dm-target/dm-target-contract';

export const guildUniquePathResolveBroker = ({
  target,
  path,
}: {
  target: DmTarget;
  path: string;
}): string => {
  const absolute = guildPathDeriveTransformer({ target, path });

  if (!existsSync(absolute)) {
    return path;
  }

  const bumped = guildDefaultPathBumpTransformer({ path, by: 1 });
  if (bumped === path) {
    return path;
  }

  return guildUniquePathResolveBroker({ target, path: bumped });
};
