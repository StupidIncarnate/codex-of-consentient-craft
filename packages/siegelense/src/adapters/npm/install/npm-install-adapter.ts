/**
 * PURPOSE: `npm install` at a target repo root — the one step that links a freshly scaffolded
 * workspace package (`packages/hydration-recipes`) into `node_modules`, so a later `npm run build`
 * against it can resolve. Reach for this over calling `run` from `#gateway/node/child_process`
 * directly, matching every other command-specific adapter this repo composes it into
 * (`gitAddAllAdapter` and its siblings) — never call `child_process` itself outside an adapter.
 *
 * USAGE:
 * const { exitCode, output } = await npmInstallAdapter({ cwd });
 * // Runs `npm install` from that repo root, returns the exit code and output rather than throwing
 */

import { run, RunNotFoundError } from '#gateway/node/child_process';
import {
  errorMessageContract,
  exitCodeContract,
  type AbsoluteFilePath,
  type ErrorMessage,
  type ExitCode,
} from '@dungeonmaster/shared/contracts';

export const npmInstallAdapter = async ({
  cwd,
}: {
  cwd: AbsoluteFilePath;
}): Promise<{ exitCode: ExitCode; output: ErrorMessage }> => {
  // A missing `npm` binary rejects `run` with RunNotFoundError rather than resolving a result —
  // caught here and folded into the same failed-run shape the old childProcessSpawnCaptureAdapter
  // resolved for an ENOENT, so a caller reading exitCode/output sees no behavior change.
  const { exitCode, output } = await run({ command: 'npm', args: ['install'], cwd }).catch(
    (error: unknown) => {
      if (!(error instanceof RunNotFoundError)) {
        throw error;
      }
      return { exitCode: 1, output: '', signal: null, timedOut: false };
    },
  );

  return {
    exitCode: exitCodeContract.parse(exitCode),
    output: errorMessageContract.parse(output),
  };
};
