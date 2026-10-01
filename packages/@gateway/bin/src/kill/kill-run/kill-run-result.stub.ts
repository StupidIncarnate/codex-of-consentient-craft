/**
 * PURPOSE: A complete, real RunResult-shaped value matching exactly what `killRun` resolves with —
 * for a caller staging `#gateway/bin/kill`'s own real return shape instead of hand-typing one that
 * could drift from it.
 *
 * USAGE:
 * const result = KillRunResultStub({ exitCode: 1, output: 'kill: (12345): No such process' });
 */
import type { killRun } from '../kill-run/kill-run';

export const KillRunResultStub = ({
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
} = {}): Awaited<ReturnType<typeof killRun>> => ({
  exitCode,
  output,
  stdout,
  stderr,
  signal,
  timedOut,
});
