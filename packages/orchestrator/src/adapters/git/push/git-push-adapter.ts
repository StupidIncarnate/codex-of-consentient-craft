/**
 * PURPOSE: Publishes the current branch with `git push`, optionally establishing its upstream on the
 * first push, and reports the exit code rather than throwing — the caller decides what a failure
 * means
 *
 * USAGE:
 * await gitPushAdapter({ cwd, setUpstream: { branchName } });
 * // Runs `git push -u origin <branchName>` — the carve-time call that makes the branch tracked
 *
 * await gitPushAdapter({ cwd });
 * // Runs `git push` — every call after that, with no branch name to get wrong
 *
 * TWO CALLERS, ONE ORDERING. Riftcarver pushes once with `setUpstream` while carving, so every
 * later push is the bare form and no session ever has to decide whether `-u` is needed. That is
 * what lets all five `<role>-reviewer-minion` prompts write `git push` with nothing after it: the
 * branch is already tracked before the first round runs, so there is no first-push case to spell
 * out and get wrong.
 *
 * IT DOES NOT THROW. A push that fails leaves a perfectly good worktree with all its commits — only
 * the publication is missing — so the outcome is routed by the caller rather than taking the
 * session down with it.
 */

import { childProcessSpawnCaptureAdapter } from '@dungeonmaster/shared/adapters';
import {
  exitCodeContract,
  type AbsoluteFilePath,
  type ErrorMessage,
  type ExitCode,
  type QuestBranchName,
} from '@dungeonmaster/shared/contracts';

// Git's own default remote name. Riftcarver does not detect a remote the way it detects a base
// branch: a repo whose remote is named something else is a real setup, but nothing on the quest
// records one, so resolving it here would be guessing rather than reading.
const DEFAULT_REMOTE = 'origin';

export const gitPushAdapter = async ({
  cwd,
  setUpstream,
}: {
  cwd: AbsoluteFilePath;
  setUpstream?: { branchName: QuestBranchName };
}): Promise<{ exitCode: ExitCode; output: ErrorMessage }> => {
  const args =
    setUpstream === undefined ? ['push'] : ['push', '-u', DEFAULT_REMOTE, setUpstream.branchName];

  const { exitCode, output } = await childProcessSpawnCaptureAdapter({
    command: 'git',
    args,
    cwd,
  });

  return { exitCode: exitCode ?? exitCodeContract.parse(1), output };
};
