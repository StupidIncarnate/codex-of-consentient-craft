/**
 * PURPOSE: Removes the Vite dependency cache one e2e run created, addressed by the exact port that
 * run was handed. Reach for this at the end of a run; the sibling prune broker is the age-based
 * backstop for runs that never reached their own cleanup.
 *
 * It deletes the cache and NOTHING else, and both halves of that are deliberate. The cache is safe
 * to take because a project setting `optimizeDeps.force: true` re-optimizes from scratch every run
 * and never reads one back — and it is the only artifact worth chasing, at 904 MB against 68 KB of
 * `test-results` on this repo. Leaving the other two to the age sweep is what keeps a failing run's
 * traces out of reach of a pass/fail condition somebody could get backwards.
 *
 * USAGE:
 * await e2eArtifactsRemoveBroker({ packageRoot, port });
 * // Removes <packageRoot>/node_modules/.vite-<port>; succeeds whether or not it was there
 */

import {
  filePathContract,
  type AdapterResult,
  type NetworkPort,
} from '@dungeonmaster/shared/contracts';
import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

import { fsRmAdapter } from '../../../adapters/fs/rm/fs-rm-adapter';
import { e2eArtifactsStatics } from '../../../statics/e2e-artifacts/e2e-artifacts-statics';

export const e2eArtifactsRemoveBroker = async ({
  packageRoot,
  port,
}: {
  packageRoot: AbsoluteFilePath;
  port: NetworkPort;
}): Promise<AdapterResult> => {
  const [cache] = e2eArtifactsStatics.artifacts;

  const cachePath = filePathContract.parse(
    `${String(packageRoot)}/${cache.parentDir}/${cache.prefix}${String(port)}${cache.suffix}`,
  );

  try {
    // `force` turns "already gone" into a no-op, which is the ordinary outcome whenever a
    // concurrent sweep reached the same path first.
    await fsRmAdapter({ filePath: cachePath, recursive: true, force: true });
  } catch {
    // A cleanup must never change a check's verdict. Reclaiming disk is worth nothing next to
    // reporting an e2e run that really passed as a crash.
  }

  return { success: true as const };
};
