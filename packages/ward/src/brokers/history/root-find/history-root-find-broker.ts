/**
 * PURPOSE: Resolves the main repository root for a project directory, sharing duration history across worktrees
 *
 * USAGE:
 * const root = await historyRootFindBroker({ rootPath: '/repo/worktrees/feat' });
 * // Returns '/repo', or rootPath when not in a git repository or git is missing
 */

import { basename, dirname } from '#gateway/node/path';
import { commonDir, GitNotInstalledError } from '#gateway/bin/git';

export const historyRootFindBroker = async ({
  rootPath,
}: {
  rootPath: string;
}): Promise<string> => {
  try {
    const commonDirResult = await commonDir({ cwd: rootPath });
    if (commonDirResult === null) {
      return rootPath;
    }
    if (basename(commonDirResult) === '.git') {
      return dirname(commonDirResult);
    }
    return rootPath;
  } catch (error: unknown) {
    if (error instanceof GitNotInstalledError) {
      return rootPath;
    }
    throw error;
  }
};
