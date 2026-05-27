/**
 * PURPOSE: Groups flat tsc error entries by which workspace package's path each error belongs to
 *
 * USAGE:
 * const { byPackage, unmatched } = tscOutputGroupByPackageTransformer({
 *   errors: [errorEntry1, errorEntry2],
 *   projectFolders: [{name: 'shared', path: '/root/packages/shared'}, ...],
 *   rootPath: absoluteFilePathContract.parse('/root'),
 * });
 * // Returns Map<ProjectPath, ErrorEntry[]> + unmatched ErrorEntry[]
 */

import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

import type { ErrorEntry } from '../../contracts/error-entry/error-entry-contract';
import type { ProjectFolder } from '../../contracts/project-folder/project-folder-contract';

export const tscOutputGroupByPackageTransformer = ({
  errors,
  projectFolders,
  rootPath,
}: {
  errors: readonly ErrorEntry[];
  projectFolders: readonly ProjectFolder[];
  rootPath: AbsoluteFilePath;
}): {
  byPackage: Map<ProjectFolder['path'], ErrorEntry[]>;
  unmatched: ErrorEntry[];
} => {
  const byPackage = new Map<ProjectFolder['path'], ErrorEntry[]>();
  for (const folder of projectFolders) {
    byPackage.set(folder.path, []);
  }
  const unmatched: ErrorEntry[] = [];

  const folderPathsSorted = [...projectFolders].sort(
    (a, b) => String(b.path).length - String(a.path).length,
  );
  const rootPrefix = `${String(rootPath)}/`;

  for (const error of errors) {
    const filePathStr = String(error.filePath);
    const absolute = filePathStr.startsWith('/') ? filePathStr : `${rootPrefix}${filePathStr}`;
    let assigned = false;
    for (const folder of folderPathsSorted) {
      const folderPath = String(folder.path);
      if (absolute === folderPath || absolute.startsWith(`${folderPath}/`)) {
        byPackage.get(folder.path)?.push(error);
        assigned = true;
        break;
      }
    }
    if (!assigned) {
      unmatched.push(error);
    }
  }

  return { byPackage, unmatched };
};
