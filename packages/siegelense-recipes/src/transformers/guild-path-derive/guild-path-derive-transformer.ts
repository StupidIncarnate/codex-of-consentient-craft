/**
 * PURPOSE: Resolves a guild's `path` field against the target's own home, so the write route
 * and the api route can never disagree about where a seeded guild's directory lives. Reach for
 * this over each route deriving its own string: `defaults(index)` (which sees the row's index,
 * never the target) supplies a RELATIVE fragment such as `guilds-under-test/guild-1`, and this
 * transformer is the one place that turns it absolute — an explicit, already-absolute `path` a
 * caller `set()` onto a row passes through unchanged, which is what lets a real directory
 * override the derived one.
 *
 * USAGE:
 * guildPathDeriveTransformer({ target, path: guildPathContract.parse('guilds-under-test/guild-1') });
 * // Returns '<target.home>/guilds-under-test/guild-1' as GuildPath
 */
import { guildPathContract } from '@dungeonmaster/shared/contracts';
import type { GuildPath } from '@dungeonmaster/shared/contracts';

import { isAbsoluteGuildPathGuard } from '../../guards/is-absolute-guild-path/is-absolute-guild-path-guard';
import type { DmTarget } from '../../contracts/dm-target/dm-target-contract';

export const guildPathDeriveTransformer = ({
  target,
  path,
}: {
  target: DmTarget;
  path: GuildPath;
}): GuildPath =>
  guildPathContract.parse(isAbsoluteGuildPathGuard({ path }) ? path : `${target.home}/${path}`);
