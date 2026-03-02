/**
 * PURPOSE: Normalizes a file path to a relative path by stripping a cwd prefix if present
 *
 * USAGE:
 * normalizeToRelativeTransformer({ filePath: gitRelativePathContract.parse('/project/src/a.ts'), cwd: absoluteFilePathContract.parse('/project') });
 * // Returns: GitRelativePath 'src/a.ts'
 */

import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

import {
  gitRelativePathContract,
  type GitRelativePath,
} from '../../contracts/git-relative-path/git-relative-path-contract';

export const normalizeToRelativeTransformer = ({
  filePath,
  cwd,
}: {
  filePath: GitRelativePath;
  cwd: AbsoluteFilePath;
}): GitRelativePath => {
  const fileString = String(filePath);
  const cwdString = String(cwd);
  const cwdPrefix = cwdString.endsWith('/') ? cwdString : `${cwdString}/`;

  if (fileString.startsWith(cwdPrefix)) {
    return gitRelativePathContract.parse(fileString.slice(cwdPrefix.length));
  }

  return filePath;
};
