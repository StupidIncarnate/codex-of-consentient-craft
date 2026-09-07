/**
 * PURPOSE: Walks up from a starting directory to the nearest ancestor whose `package.json`
 * declares a `workspaces` field. installTestbedCreateBroker calls this instead of a fixed
 * `__dirname` hop count, which is only correct while this package resolves to its compiled
 * `dist/src/...` location — resolving to `src/...` directly (ts-jest, `--conditions=source`)
 * removes one directory level and the fixed count overshoots the repo root.
 *
 * USAGE:
 * const repoRoot = findRepoRootLayerBroker({ startPath: filePathContract.parse(__dirname) });
 * // Returns FilePath to the nearest ancestor holding a package.json with a workspaces field
 */

import { fsExistsAdapter } from '../../../adapters/fs/exists/fs-exists-adapter';
import { fsReadFileAdapter } from '../../../adapters/fs/read-file/fs-read-file-adapter';
import { pathJoinAdapter } from '../../../adapters/path/join/path-join-adapter';
import { pathDirnameAdapter } from '../../../adapters/path/dirname/path-dirname-adapter';
import type { FilePath } from '../../../contracts/file-path/file-path-contract';

export const findRepoRootLayerBroker = ({
  startPath,
  currentPath,
}: {
  startPath: FilePath;
  currentPath?: FilePath;
}): FilePath => {
  const searchPath = currentPath ?? startPath;
  const packageJsonPath = pathJoinAdapter({ paths: [searchPath, 'package.json'] });

  if (fsExistsAdapter({ filePath: packageJsonPath })) {
    const raw = fsReadFileAdapter({ filePath: packageJsonPath });
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed === 'object' && parsed !== null && 'workspaces' in parsed) {
      return searchPath;
    }
  }

  const parentPath = pathDirnameAdapter({ filePath: searchPath });

  if (parentPath === searchPath) {
    throw new Error(
      `findRepoRootLayerBroker: reached the filesystem root without finding a package.json with a workspaces field, starting from ${startPath}`,
    );
  }

  return findRepoRootLayerBroker({ startPath, currentPath: parentPath });
};
