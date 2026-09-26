/**
 * PURPOSE: Reads the commits a branch has produced since a pinned base, each with the paths it
 * touched. `scope` is read off the commit BODY's `work items:` line, never parsed out of the
 * subject — a commit with no such line gets `scope: null` rather than a guessed label. Throws on a
 * non-zero git exit, preserved from the adapter this replaces. The record separators
 * (`\u001e`/`\u001f`) are what let a multi-line body coexist with the path list that follows it.
 *
 * USAGE:
 * await logNameOnly({ cwd: '/repo', baseRef: 'a1b2c3d4' });
 * // Returns commits newest first, each { sha, scope, subject, paths }
 */

import { gitRun } from './git-run';

const COMMIT_SEPARATOR = '\u001e';
const FIELD_SEPARATOR = '\u001f';
const LOG_FORMAT = `--format=%x1e%H%x1f%s%x1f%b%x1f`;
const SCOPE_LINE_PREFIX = 'work items:';
const SHA_INDEX = 0;
const SUBJECT_INDEX = 1;
const BODY_INDEX = 2;
const PATHS_INDEX = 3;

export const logNameOnly = async ({
  cwd,
  baseRef,
}: {
  cwd: string;
  baseRef: string;
}): Promise<{ sha: string; scope: string | null; subject: string; paths: string[] }[]> => {
  const revisionRange = `${baseRef}..HEAD`;

  const { exitCode, output } = await gitRun({
    args: ['log', '--name-only', LOG_FORMAT, revisionRange],
    cwd,
  });

  if (exitCode !== 0) {
    throw new Error(
      `git log ${revisionRange} --name-only failed with exit code ${String(exitCode)}: ${output}`,
    );
  }

  return output
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

      return {
        sha: fields[SHA_INDEX]?.trim() ?? '',
        scope: scope.length > 0 ? scope : null,
        subject: fields[SUBJECT_INDEX]?.trim() ?? '',
        paths: (fields[PATHS_INDEX] ?? '')
          .split('\n')
          .map((line) => line.trim())
          .filter((line) => line.length > 0),
      };
    });
};
