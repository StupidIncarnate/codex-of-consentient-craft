/**
 * PURPOSE: Scans tsc --listFiles output and counts processed source files per package folder
 *
 * USAGE:
 * const counts = tscOutputCountFilesByPackageTransformer({
 *   output: '/repo/packages/shared/src/index.ts\n/repo/packages/web/src/app.ts',
 *   projectFolders: [{name: 'shared', path: '/repo/packages/shared'}, ...],
 *   rootPath: absoluteFilePathContract.parse('/repo'),
 * });
 * // Returns Map<ProjectPath, FilesCount> keyed by projectFolder.path
 */

import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

import type { ProjectFolder } from '../../contracts/project-folder/project-folder-contract';
import { projectResultContract } from '../../contracts/project-result/project-result-contract';

type FilesCount = ReturnType<typeof projectResultContract.shape.filesCount.parse>;

export const tscOutputCountFilesByPackageTransformer = ({
  output,
  projectFolders,
  rootPath,
}: {
  output: string;
  projectFolders: readonly ProjectFolder[];
  rootPath: AbsoluteFilePath;
}): Map<ProjectFolder['path'], FilesCount> => {
  const counts = new Map<ProjectFolder['path'], FilesCount>();
  for (const folder of projectFolders) {
    counts.set(folder.path, projectResultContract.shape.filesCount.parse(0));
  }

  const folderPathsSorted = [...projectFolders].sort(
    (a, b) => String(b.path).length - String(a.path).length,
  );

  const rootStr = String(rootPath);

  for (const line of output.split('\n')) {
    const trimmed = line.trim();
    if (trimmed.length === 0) continue;
    if (!trimmed.startsWith('/')) continue;
    if (trimmed.includes('node_modules')) continue;
    if (!trimmed.startsWith(rootStr)) continue;

    for (const folder of folderPathsSorted) {
      const folderPath = String(folder.path);
      if (trimmed === folderPath || trimmed.startsWith(`${folderPath}/`)) {
        const current = counts.get(folder.path) ?? projectResultContract.shape.filesCount.parse(0);
        counts.set(folder.path, projectResultContract.shape.filesCount.parse(Number(current) + 1));
        break;
      }
    }
  }

  return counts;
};
