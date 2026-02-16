/**
 * PURPOSE: Discovers changed files by detecting the default branch and running git diff
 *
 * USAGE:
 * const files = await changedFilesDiscoverBroker({ cwd: AbsoluteFilePathStub({ value: '/project' }) });
 * // Returns GitRelativePath[] of files changed relative to the default branch
 */

import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

import type { GitRelativePath } from '../../../contracts/git-relative-path/git-relative-path-contract';
import { gitDiffFilesBroker } from '../../git/diff-files/git-diff-files-broker';

export const changedFilesDiscoverBroker = async ({
  cwd,
}: {
  cwd: AbsoluteFilePath;
}): Promise<GitRelativePath[]> => gitDiffFilesBroker({ cwd });
