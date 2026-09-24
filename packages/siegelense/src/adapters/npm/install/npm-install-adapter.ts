/**
 * PURPOSE: `npm install` at a target repo root — the one step that links a freshly scaffolded
 * workspace package (`packages/hydration-recipes`) into `node_modules`, so a later `npm run build`
 * against it can resolve. Reach for this over calling `childProcessSpawnCaptureAdapter` directly,
 * matching every other command-specific adapter this repo composes it into (`gitAddAllAdapter` and
 * its siblings) — never call `child_process` itself outside an adapter.
 *
 * USAGE:
 * const { exitCode, output } = await npmInstallAdapter({ cwd });
 * // Runs `npm install` from that repo root, returns the exit code and output rather than throwing
 */

import { childProcessSpawnCaptureAdapter } from '@dungeonmaster/shared/adapters';
import {
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
  const { exitCode, output } = await childProcessSpawnCaptureAdapter({
    command: 'npm',
    args: ['install'],
    cwd,
  });

  return { exitCode: exitCode ?? exitCodeContract.parse(1), output };
};
