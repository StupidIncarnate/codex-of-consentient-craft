/**
 * PURPOSE: Resolves a glob pattern to a list of matching file paths relative to the base path
 *
 * USAGE:
 * const files = await globResolveBroker({ pattern: '**\/*.ts', basePath: AbsoluteFilePathStub({ value: '/project' }) });
 * // Returns GitRelativePath[] of files matching the glob pattern
 */

import { childProcessSpawnCaptureAdapter } from '@dungeonmaster/shared/adapters';
import { exitCodeContract, type AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

import {
  gitRelativePathContract,
  type GitRelativePath,
} from '../../../contracts/git-relative-path/git-relative-path-contract';

export const globResolveBroker = async ({
  pattern,
  basePath,
}: {
  pattern: string;
  basePath: AbsoluteFilePath;
}): Promise<GitRelativePath[]> => {
  const result = await childProcessSpawnCaptureAdapter({
    command: 'git',
    args: ['ls-files', '--cached', '--others', '--exclude-standard', '--', pattern],
    cwd: basePath,
  });

  if (result.exitCode !== exitCodeContract.parse(0)) {
    return [];
  }

  const lines = result.output.trim();

  if (lines.length === 0) {
    return [];
  }

  return lines.split('\n').map((line) => gitRelativePathContract.parse(line));
};
