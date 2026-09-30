/**
 * PURPOSE: Decides whether a scan's paths reach one package and what to hand ESLint there. Paths
 * may be repo-relative, `./`-prefixed or absolute; a path naming the package folder itself, or no
 * paths at all, scans the whole package.
 *
 * USAGE:
 * scanFolderTargetsTransformer({ paths: [CliArgStub({ value: 'packages/ward/src/a.ts' })], projectFolder: ProjectFolderStub(), rootPath: AbsoluteFilePathStub() });
 * // Returns: { inScope: true, targets: ['src/a.ts'] } for a package at packages/ward
 */

import type { ProjectFolder } from '../../contracts/project-folder/project-folder-contract';
import {
  scanFolderTargetsContract,
  type ScanFolderTargets,
} from '../../contracts/scan-folder-targets/scan-folder-targets-contract';
import { isPathUnderDirectoryGuard } from '../../guards/is-path-under-directory/is-path-under-directory-guard';

const CURRENT_DIRECTORY_PREFIX = /^\.\//u;
const TRAILING_SLASHES = /\/+$/u;

export const scanFolderTargetsTransformer = ({
  paths,
  projectFolder,
  rootPath,
}: {
  paths: string[];
  projectFolder: ProjectFolder;
  rootPath: string;
}): ScanFolderTargets => {
  if (paths.length === 0) {
    return scanFolderTargetsContract.parse({ inScope: true, targets: [] });
  }

  const rootPrefix = `${rootPath}/`;
  const folderPath = String(projectFolder.path).slice(rootPrefix.length);

  const reaching = paths
    .map((path) => {
      const relative = path.startsWith(rootPrefix)
        ? path.slice(rootPrefix.length)
        : path;
      return relative.replace(CURRENT_DIRECTORY_PREFIX, '').replace(TRAILING_SLASHES, '');
    })
    .filter((path) => isPathUnderDirectoryGuard({ path, directory: folderPath }));

  if (reaching.length === 0) {
    return scanFolderTargetsContract.parse({ inScope: false, targets: [] });
  }

  if (reaching.includes(folderPath)) {
    return scanFolderTargetsContract.parse({ inScope: true, targets: [] });
  }

  return scanFolderTargetsContract.parse({
    inScope: true,
    targets: reaching.map((path) => path.slice(folderPath.length + 1)),
  });
};
