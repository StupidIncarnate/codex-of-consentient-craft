/**
 * PURPOSE: A complete, real RunResult-shaped value matching exactly what `npmRun` resolves with —
 * for a caller staging `#gateway/bin/npm`'s own real return shape instead of hand-typing one that
 * could drift from it.
 *
 * USAGE:
 * const result = NpmRunResultStub({ output: 'added 1 package' });
 */
import type { npmRun } from '../npm-run/npm-run';

export const NpmRunResultStub = ({
  exitCode = 0,
  output = '',
  signal = null,
  timedOut = false,
}: {
  exitCode?: number;
  output?: string;
  signal?: NodeJS.Signals | null;
  timedOut?: boolean;
} = {}): Awaited<ReturnType<typeof npmRun>> => ({ exitCode, output, signal, timedOut });
