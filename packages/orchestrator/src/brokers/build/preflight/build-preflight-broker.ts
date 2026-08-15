/**
 * PURPOSE: Runs a whitespace-separated build command ONCE inside a given directory, handing each
 * line to the caller as the child emits it. Reach for `buildUntilGreenBroker` instead whenever the
 * tree has never been built — a single pass cannot clear a workspace whose packages compile out of
 * dependency order. This one exists for the caller that genuinely wants one attempt and the exit
 * code that came with it.
 *
 * `onLine` is required rather than optional on purpose: a build is the longest-running child the
 * orchestrator spawns, and its output exists nowhere else until the process exits, so an omitted
 * callback would silently choose a dead panel (see packages/shared/CLAUDE.md, "Streaming Adapters").
 *
 * USAGE:
 * const { success, output, exitCode } = await buildPreflightBroker({
 *   buildCommand: 'npm run build',
 *   cwd: AbsoluteFilePathStub({ value: '/repo/worktrees/add-auth-7bc217a1' }),
 *   onLine: (line) => emit(line),
 * });
 * // `output` is the whole run's combined stdout + stderr, available only once the child exits
 */

import {
  errorMessageContract,
  exitCodeContract,
  type AbsoluteFilePath,
  type ErrorMessage,
  type ExitCode,
} from '@dungeonmaster/shared/contracts';
import { childProcessSpawnStreamLinesAdapter } from '@dungeonmaster/shared/adapters';

export const buildPreflightBroker = async ({
  buildCommand,
  cwd,
  onLine,
}: {
  buildCommand: string;
  cwd: AbsoluteFilePath;
  // Required, never optional. A build runs for minutes and its output exists nowhere else while
  // it is running — see packages/shared/CLAUDE.md, "Streaming Adapters". Pass `() => undefined`
  // to opt out and the choice is visible at the call site.
  onLine: (line: string) => void;
}): Promise<{ success: boolean; output: ErrorMessage; exitCode: ExitCode }> => {
  const parts = buildCommand.split(' ').filter(Boolean);
  const [command, ...args] = parts;

  if (command === undefined) {
    return {
      success: false,
      output: errorMessageContract.parse('Build command is empty'),
      exitCode: exitCodeContract.parse(1),
    };
  }

  const { exitCode: rawExitCode, output } = await childProcessSpawnStreamLinesAdapter({
    command,
    args,
    cwd,
    onLine,
  });

  const exitCode = rawExitCode ?? exitCodeContract.parse(1);
  const success = exitCode === 0;

  return { success, output, exitCode };
};
