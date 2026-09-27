/**
 * PURPOSE: A complete, real RunResult-shaped value matching exactly what `cpRun` resolves with —
 * for a caller staging `#gateway/bin/cp`'s own real return shape instead of hand-typing one that
 * could drift from it.
 *
 * USAGE:
 * const result = CpRunResultStub({ exitCode: 1, output: "cp: cannot stat 'x': No such file" });
 */
import type { cpRun } from '../cp-run/cp-run';

export const CpRunResultStub = ({
  exitCode = 0,
  output = '',
  signal = null,
  timedOut = false,
}: {
  exitCode?: number;
  output?: string;
  signal?: NodeJS.Signals | null;
  timedOut?: boolean;
} = {}): Awaited<ReturnType<typeof cpRun>> => ({ exitCode, output, signal, timedOut });
