/**
 * PURPOSE: Detects whether the git repo uses 'main' or 'master' as its default branch
 *
 * USAGE:
 * const branch = await gitDetectDefaultBranchBroker({ cwd: AbsoluteFilePathStub({ value: '/project' }) });
 * // Returns GitBranchName('main'), GitBranchName('master'), or null if neither exists
 */

import { detectDefaultBranch, GitNotInstalledError } from '#gateway/bin/git';
import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';


export const gitDetectDefaultBranchBroker = async ({
  cwd,
}: {
  cwd: AbsoluteFilePath;
}): Promise<string | null> => {
  // A missing `git` binary makes the gateway throw GitNotInstalledError rather than resolve a
  // result — folded into null here so "git is not on this machine" reads as "neither branch
  // verified", exactly as it always has.
  try {
    const branch = await detectDefaultBranch({ cwd });
    return branch === null ? null : branch;
  } catch (error: unknown) {
    if (!(error instanceof GitNotInstalledError)) {
      throw error;
    }
    return null;
  }
};
