/**
 * PURPOSE: A complete, real RunResult-shaped value matching exactly what `lsofRun` resolves with —
 * for a caller staging `#gateway/bin/lsof`'s own real return shape instead of hand-typing one that
 * could drift from it.
 *
 * USAGE:
 * const result = LsofRunResultStub({ output: '12345' });
 */
import type { lsofRun } from '../lsof-run/lsof-run';

export const LsofRunResultStub = ({
  exitCode = 0,
  output = '',
  signal = null,
  timedOut = false,
}: {
  exitCode?: number;
  output?: string;
  signal?: NodeJS.Signals | null;
  timedOut?: boolean;
} = {}): Awaited<ReturnType<typeof lsofRun>> => ({ exitCode, output, signal, timedOut });
