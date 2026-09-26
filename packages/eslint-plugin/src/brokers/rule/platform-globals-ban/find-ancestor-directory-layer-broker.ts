/**
 * PURPOSE: Walks a directory tree upward from a starting point looking for the nearest ancestor
 * (inclusive of the start) that contains a named marker file — the mechanism
 * resolvePackagePlatformLayerBroker uses to find a package root (marker: 'package.json') and
 * resolveGatewayScopeLayerBroker uses to find the repo root (marker: '.dungeonmaster.json',
 * matching locationsStatics.repoRoot.config). Recurses upward instead of looping so the walk has an
 * early return the moment the filesystem root repeats its own parent.
 *
 * USAGE:
 * findAncestorDirectoryLayerBroker({ startDir: filePathContract.parse('/repo/packages/node/src/fs'), markerFileName: 'package.json' });
 * // Returns '/repo/packages/node' as FilePath, or undefined if no ancestor holds the marker
 */
import { filePathContract, type FilePath } from '@dungeonmaster/shared/contracts';
import { fsExistsSyncAdapter } from '../../../adapters/fs/exists-sync/fs-exists-sync-adapter';
import { pathJoinAdapter } from '../../../adapters/path/join/path-join-adapter';
import { pathDirnameAdapter } from '../../../adapters/path/dirname/path-dirname-adapter';

export const findAncestorDirectoryLayerBroker = ({
  startDir,
  markerFileName,
}: {
  startDir: FilePath;
  markerFileName: string;
}): FilePath | undefined => {
  const markerPath = pathJoinAdapter({ paths: [startDir, markerFileName] });
  if (fsExistsSyncAdapter({ filePath: markerPath })) {
    return startDir;
  }

  const parentDir = pathDirnameAdapter({ filePath: startDir });
  if (parentDir === startDir) {
    return undefined;
  }

  return findAncestorDirectoryLayerBroker({
    startDir: filePathContract.parse(parentDir),
    markerFileName,
  });
};
