/**
 * PURPOSE: Keeps Jest's shared transform cache from growing without bound. Ward runs it at the start
 * of any run that includes `unit` or `integration`, the only checks that write to that cache.
 * Reach for `e2eArtifactsPruneBroker` instead for a package's own Playwright and Vite leftovers;
 * this one sweeps the one directory every package and worktree shares.
 *
 * THE DIRECTORY IS JEST'S OWN FORMULA, not a guess: `realpath(os.tmpdir())` joined with
 * `jest_<uid in base 36>` (jest-config `getCacheDirectory`), or plain `jest` where the platform has
 * no uid. No jest config in this repo sets `cacheDirectory`, so the default is the whole answer; a
 * repo that sets one would need its own sweep. Removal reaches only entries listed inside that one
 * directory, all of them Jest's own regenerable output under the OS tmp.
 *
 * ONE PASS OVER THE TOP-LEVEL ENTRIES, judged on their own mtime. An entry whose mtime is older than
 * the window is removed whole; a directory's mtime moves only when a direct child is added, so a hot
 * transform-cache directory that stopped receiving new files can be swept and is then rebuilt by the
 * next run. That costs one re-transform, never correctness.
 *
 * A PRUNE FAILURE NEVER FAILS A RUN. Every problem is written to stderr and the run continues, and
 * each entry is removed inside its own catch so one collision (another run sweeping the same
 * directory) does not abandon the rest.
 *
 * USAGE:
 * await jestCachePruneBroker();
 * // Removes Jest cache entries not modified within jestCacheStatics.prune.maxAgeMs; a missing cache is a no-op
 */

import { userInfo } from '#gateway/node/os';
import { readdirIfExists, realpath, rm, statIfExists } from '#gateway/node/fs__promises';
import { stderr } from '#gateway/node/process';

import { jestCacheStatics } from '../../../statics/jest-cache/jest-cache-statics';
import { tmpdirFindBroker } from '../../tmpdir/find/tmpdir-find-broker';

const UID_RADIX = 36;

export const jestCachePruneBroker = async (): Promise<void> => {
  try {
    const { uid } = userInfo();
    const realTmp = await realpath(String(tmpdirFindBroker()));
    const cacheDir = (uid < 0 ? `${realTmp}/jest` : `${realTmp}/jest_${uid.toString(UID_RADIX)}`);

    const entries = await readdirIfExists(String(cacheDir));
    if (entries === null) {
      return;
    }
    const now = Date.now();

    await Promise.all(
      entries.map(async (name) => {
        const entryPath = `${String(cacheDir)}/${name}`;

        try {
          const stats = await statIfExists(String(entryPath));

          if (stats === null || now - stats.modifiedAtMs <= jestCacheStatics.prune.maxAgeMs) {
            return;
          }

          await rm(String(entryPath), { recursive: true, force: true });
        } catch (error: unknown) {
          stderr.write(
            `ward: could not prune Jest cache entry ${String(entryPath)}: ${String(error)}\n`,
          );
        }
      }),
    );
  } catch (error: unknown) {
    stderr.write(`ward: Jest cache prune skipped: ${String(error)}\n`);
  }
};
