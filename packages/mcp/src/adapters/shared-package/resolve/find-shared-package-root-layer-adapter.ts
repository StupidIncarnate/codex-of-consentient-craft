/**
 * PURPOSE: Walks up from a starting directory to the nearest ancestor holding a `package.json`.
 * sharedPackageResolveAdapter calls this instead of a fixed `dirname(dirname(...))` hop count,
 * which is only correct while the `/contracts` subpath export resolves to `dist/contracts.js` —
 * under `--conditions=source` (tsx) it resolves to `contracts.ts` directly at the package root,
 * one directory level higher, so a fixed hop count overshoots into `packages/`. Nothing else
 * sits between either resolved path and @dungeonmaster/shared's own root, so the nearest
 * ancestor package.json is always that package's own.
 *
 * USAGE:
 * const packageRoot = findSharedPackageRootLayerAdapter({ startDir: dirname(resolvedPath) });
 * // Returns PathSegment to the nearest ancestor holding a package.json, or null if none is found
 */

import { dirname, join } from 'path';
import { existsSync } from 'fs';
import { pathSegmentContract } from '@dungeonmaster/shared/contracts';
import type { PathSegment } from '@dungeonmaster/shared/contracts';

export const findSharedPackageRootLayerAdapter = ({
  startDir,
}: {
  startDir: string;
}): PathSegment | null => {
  const packageJsonPath = join(startDir, 'package.json');

  if (existsSync(packageJsonPath)) {
    return pathSegmentContract.parse(startDir);
  }

  const parentDir = dirname(startDir);

  if (parentDir === startDir) {
    return null;
  }

  return findSharedPackageRootLayerAdapter({ startDir: parentDir });
};
