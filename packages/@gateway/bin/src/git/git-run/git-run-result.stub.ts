/**
 * PURPOSE: A complete, real RunResult-shaped value matching exactly what `gitRun` resolves with —
 * for a caller staging `#gateway/bin/git`'s own real return shape instead of hand-typing one that
 * could drift from it.
 *
 * USAGE:
 * const result = GitRunResultStub({ output: 'main' });
 * // Returns { exitCode: 0, output: 'main', stdout: '', stderr: '', signal: null, timedOut: false }
 */
import type { gitRun } from '../git-run/git-run';

export const GitRunResultStub = ({
  exitCode = 0,
  output = '',
  stdout = '',
  stderr = '',
  signal = null,
  timedOut = false,
}: {
  exitCode?: number;
  output?: string;
  stdout?: string;
  stderr?: string;
  signal?: NodeJS.Signals | null;
  timedOut?: boolean;
} = {}): Awaited<ReturnType<typeof gitRun>> => ({
  exitCode,
  output,
  stdout,
  stderr,
  signal,
  timedOut,
});
