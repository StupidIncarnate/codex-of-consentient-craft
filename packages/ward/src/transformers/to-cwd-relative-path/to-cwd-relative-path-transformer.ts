/**
 * PURPOSE: Converts a file path to be relative to the current working directory
 *
 * USAGE:
 * toCwdRelativePathTransformer({filePath: ErrorEntryStub().filePath, projectPath: ProjectFolderStub().path, cwd: AbsoluteFilePathStub()});
 * // Returns ErrorFilePath relative to cwd (e.g., 'src/file.ts' or 'packages/cli/src/file.ts')
 */

import type { ErrorEntry } from '../../contracts/error-entry/error-entry-contract';
import { errorEntryContract } from '../../contracts/error-entry/error-entry-contract';
import type { ProjectFolder } from '../../contracts/project-folder/project-folder-contract';

export const toCwdRelativePathTransformer = ({
  filePath,
  projectPath,
  cwd,
}: {
  filePath: ErrorEntry['filePath'];
  projectPath: ProjectFolder['path'];
  cwd: string;
}): ErrorEntry['filePath'] => {
  const cwdPrefix = `${cwd}/`;
  const absolute = String(filePath).startsWith('/')
    ? String(filePath)
    : `${String(projectPath)}/${String(filePath)}`;
  const relative = absolute.startsWith(cwdPrefix) ? absolute.slice(cwdPrefix.length) : absolute;
  return errorEntryContract.shape.filePath.parse(relative);
};
