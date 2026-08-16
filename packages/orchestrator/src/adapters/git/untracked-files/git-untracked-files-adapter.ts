/**
 * PURPOSE: Lists the files git can see but has never been told about. Reach for this alongside
 * `gitDiffFilesAdapter` — never instead of it — whenever the surface being measured is a WORKING
 * TREE rather than committed history: `git diff` in every form reports tracked paths only, so every
 * net-new file a session has just written is invisible to it. A pre-commit review that leaned on
 * the diff alone would come back green having never opened the files most likely to carry a defect.
 *
 * USAGE:
 * const files = await gitUntrackedFilesAdapter({ cwd: AbsoluteFilePathStub({ value: '/project' }) });
 * // Returns RepoRelativePath[] in git's reported order
 *
 * `--exclude-standard` applies `.gitignore`, `.git/info/exclude`, and the global excludes, so
 * `node_modules/`, `dist/`, and log spill never reach a review surface. Without it this returns
 * every ignored file in the tree and the reading is worthless.
 */

import { childProcessSpawnCaptureAdapter } from '@dungeonmaster/shared/adapters';
import {
  exitCodeContract,
  repoRelativePathContract,
  type AbsoluteFilePath,
  type RepoRelativePath,
} from '@dungeonmaster/shared/contracts';

export const gitUntrackedFilesAdapter = async ({
  cwd,
}: {
  cwd: AbsoluteFilePath;
}): Promise<RepoRelativePath[]> => {
  const { exitCode, output } = await childProcessSpawnCaptureAdapter({
    command: 'git',
    args: ['ls-files', '--others', '--exclude-standard'],
    cwd,
  });

  if (exitCode !== exitCodeContract.parse(0)) {
    throw new Error(
      `git ls-files --others --exclude-standard failed with exit code ${String(exitCode)}: ${output}`,
    );
  }

  return output
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => repoRelativePathContract.parse(line));
};
