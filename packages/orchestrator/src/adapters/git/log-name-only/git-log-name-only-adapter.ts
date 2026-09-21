/**
 * PURPOSE: Reads the commits a quest branch has produced since its pinned base, each with the paths
 * it touched. Reach for this over `gitDiffFilesAdapter` when the question is WHICH PASS wrote a file
 * rather than which files changed: a diff collapses every commit into one set, and a planner picking
 * up a cell needs to know that the library package's session already landed the helper it was about
 * to brief.
 *
 * USAGE:
 * await gitLogNameOnlyAdapter({ cwd, baseRef });
 * // Returns QuestWorkCommit[], newest first, each with { sha, scope, subject, paths }
 *
 * `scope` IS READ OFF THE BODY, NEVER PARSED OUT OF THE SUBJECT. A deterministic `commit` handler
 * writes a `work items: <ids>` line into the commit body; commits written by an operator's reviewer
 * carry a prose subject instead, and both grammars sit on one branch while that handler rolls out.
 * Guessing a scope out of prose mislabels which pass produced a file, and a wrong label is worse
 * than none — so a commit whose body carries no such line gets `scope: null`.
 *
 * THE RECORD SEPARATORS ARE LOAD-BEARING. `--name-only` prints the format, then a blank line, then
 * the paths, so a newline-delimited parse cannot tell a path from the tail of a multi-line body.
 * `%x1e` opens each commit and `%x1f` separates its three fields, leaving everything after the third
 * separator as that commit's path block — characters git will never emit from a subject or a body.
 */

import { childProcessSpawnCaptureAdapter } from '@dungeonmaster/shared/adapters';
import { exitCodeContract, repoRelativePathContract } from '@dungeonmaster/shared/contracts';
import type { AbsoluteFilePath, Quest } from '@dungeonmaster/shared/contracts';

import { commitShaContract } from '../../../contracts/commit-sha/commit-sha-contract';
import { questWorkViewContract } from '../../../contracts/quest-work-view/quest-work-view-contract';
import type { QuestWorkCommit } from '../../../contracts/quest-work-view/quest-work-view-contract';

type GitBaseRef = NonNullable<Quest['baseRef']>;

const COMMIT_SEPARATOR = '\u001e';
const FIELD_SEPARATOR = '\u001f';
const LOG_FORMAT = `--format=%x1e%H%x1f%s%x1f%b%x1f`;
// The line story 20's `commit` handler writes into the body. Everything after it on that line is the
// scope.
const SCOPE_LINE_PREFIX = 'work items:';
const SHA_INDEX = 0;
const SUBJECT_INDEX = 1;
const BODY_INDEX = 2;
const PATHS_INDEX = 3;

export const gitLogNameOnlyAdapter = async ({
  cwd,
  baseRef,
}: {
  cwd: AbsoluteFilePath;
  baseRef: GitBaseRef;
}): Promise<QuestWorkCommit[]> => {
  const revisionRange = `${String(baseRef)}..HEAD`;

  const { exitCode, output } = await childProcessSpawnCaptureAdapter({
    command: 'git',
    args: ['log', '--name-only', LOG_FORMAT, revisionRange],
    cwd,
  });

  if (exitCode !== exitCodeContract.parse(0)) {
    throw new Error(
      `git log ${revisionRange} --name-only failed with exit code ${String(exitCode)}: ${output}`,
    );
  }

  return String(output)
    .split(COMMIT_SEPARATOR)
    .filter((record) => record.trim().length > 0)
    .map((record) => {
      const fields = record.split(FIELD_SEPARATOR);
      const body = fields[BODY_INDEX] ?? '';

      const scopeLine = body
        .split('\n')
        .map((line) => line.trim())
        .find((line) => line.startsWith(SCOPE_LINE_PREFIX));

      const scope = scopeLine?.slice(SCOPE_LINE_PREFIX.length).trim() ?? '';

      return questWorkViewContract.shape.committedPaths.removeDefault().element.parse({
        sha: commitShaContract.parse(fields[SHA_INDEX]?.trim() ?? ''),
        scope: scope.length > 0 ? scope : null,
        subject: fields[SUBJECT_INDEX]?.trim() ?? '',
        paths: (fields[PATHS_INDEX] ?? '')
          .split('\n')
          .map((line) => line.trim())
          .filter((line) => line.length > 0)
          .map((line) => repoRelativePathContract.parse(line)),
      });
    });
};
