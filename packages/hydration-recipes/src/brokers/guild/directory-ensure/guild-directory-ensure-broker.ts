/**
 * PURPOSE: Creates a guild's own directory when it resolves inside the target — the ONE mkdir
 * both the `write` and `api` routes need before they register a guild, so a live siegelense lane
 * (which always selects `api` — `routeSelectTransformer` prefers it whenever a target carries a
 * `baseUrl`) stands up the SAME directory the `write` route already did, and a seeded guild reads
 * back `valid: true` from `guildQueryRouteBroker`'s own `fs.access` check regardless of which
 * route ran. Extracted so both routes share one fencing check rather than two copies drifting
 * apart, and so the fencing itself is provable on real disk with no HTTP involved.
 *
 * THE MKDIR IS FENCED TO THE TARGET: a path resolving inside `target.home` gets its directory
 * made; an already-absolute path OUTSIDE the target is left untouched, since it legitimately
 * points at a project the operator already has — `guild-write-route-broker.ts`'s own header has
 * the full reasoning (resolve before comparing, and compare with the separator so a sibling whose
 * name merely begins with the target is never mistaken for a path inside it).
 *
 * USAGE:
 * await guildDirectoryEnsureBroker({ target, path: '/tmp/dm-home/guilds-under-test/guild-1' });
 * // Creates the directory when it resolves inside target.home; no-ops otherwise
 */
import { ensureDir } from '#gateway/node/fs__promises';
import { resolve } from '#gateway/node/path';

import type { DmTarget } from '../../../contracts/dm-target/dm-target-contract';

export const guildDirectoryEnsureBroker = async ({
  target,
  path,
}: {
  target: DmTarget;
  path: string;
}): Promise<void> => {
  const targetRoot = resolve(target.home);
  const guildDir = resolve(path);

  if (guildDir === targetRoot || guildDir.startsWith(`${targetRoot}/`)) {
    await ensureDir(guildDir);
  }
};
