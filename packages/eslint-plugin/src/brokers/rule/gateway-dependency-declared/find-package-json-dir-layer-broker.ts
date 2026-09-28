/**
 * PURPOSE: Walks a directory tree upward from a linted file's own directory to the nearest ancestor
 * (inclusive of the start) holding a package.json — the importing file's OWN manifest, not the
 * workspaces root repoScopeResolveBroker (`packages/eslint-plugin/src/brokers/repo-scope/resolve/`)
 * climbs past it to reach.
 * Duplicated from platform-globals-ban's identically-shaped `findAncestorDirectoryLayerBroker`,
 * deliberately: a layer file is not an entry file another domain may import.
 *
 * USAGE:
 * findPackageJsonDirLayerBroker({ startDir: filePathContract.parse('/repo/packages/hooks/src/brokers/x') });
 * // Returns '/repo/packages/hooks' as FilePath, or undefined if no ancestor holds one
 */
import { filePathContract } from '@dungeonmaster/shared/contracts';
import type { FilePath } from '@dungeonmaster/shared/contracts';
import { existsSync } from '#gateway/node/fs';
import { pathJoinAdapter } from '../../../adapters/path/join/path-join-adapter';
import { pathDirnameAdapter } from '../../../adapters/path/dirname/path-dirname-adapter';

export const findPackageJsonDirLayerBroker = ({
  startDir,
}: {
  startDir: FilePath;
}): FilePath | undefined => {
  const packageJsonPath = pathJoinAdapter({ paths: [startDir, 'package.json'] });

  if (existsSync(packageJsonPath)) {
    return startDir;
  }

  const parentDir = pathDirnameAdapter({ filePath: startDir });
  if (parentDir === startDir) {
    return undefined;
  }

  return findPackageJsonDirLayerBroker({ startDir: filePathContract.parse(parentDir) });
};
