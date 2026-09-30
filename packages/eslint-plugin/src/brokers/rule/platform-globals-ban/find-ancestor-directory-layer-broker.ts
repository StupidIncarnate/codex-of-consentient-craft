/**
 * PURPOSE: Walks a directory tree upward from a starting point looking for the nearest ancestor
 * (inclusive of the start) that contains a named marker file — the mechanism
 * resolvePackagePlatformLayerBroker uses to find a package root (marker: 'package.json') and
 * resolveGatewayScopeLayerBroker uses to find the repo root (marker: '.dungeonmaster.json',
 * matching locationsStatics.repoRoot.config). Recurses upward instead of looping so the walk has an
 * early return the moment the filesystem root repeats its own parent.
 *
 * USAGE:
 * findAncestorDirectoryLayerBroker({ startDir: filePathContract.parse('/repo/packages/@gateway/node/src/fs'), markerFileName: 'package.json' });
 * // Returns '/repo/packages/@gateway/node' as FilePath, or undefined if no ancestor holds the marker
 */
import { existsSync } from '#gateway/node/fs';
import { dirname, join } from '#gateway/node/path';

export const findAncestorDirectoryLayerBroker = ({
  startDir,
  markerFileName,
}: {
  startDir: string;
  markerFileName: string;
}): string | undefined => {
  const markerPath = join(startDir, markerFileName);
  if (existsSync(markerPath)) {
    return startDir;
  }

  const parentDir = dirname(startDir);
  if (parentDir === startDir) {
    return undefined;
  }

  return findAncestorDirectoryLayerBroker({
    startDir: parentDir,
    markerFileName,
  });
};
