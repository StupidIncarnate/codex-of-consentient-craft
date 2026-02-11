/**
 * PURPOSE: Spawns npm run ward:all and captures stdout and stderr output
 *
 * USAGE:
 * const result = await spawnWardLayerBroker({ startPath: AbsoluteFilePathStub({ value: '/project' }) });
 * // Returns { exitCode: ExitCode | null, output: ErrorMessage }
 */

import type { AbsoluteFilePath, ErrorMessage, ExitCode } from '@dungeonmaster/shared/contracts';

import { childProcessSpawnCaptureAdapter } from '../../../adapters/child-process/spawn-capture/child-process-spawn-capture-adapter';

export const spawnWardLayerBroker = async ({
  startPath,
}: {
  startPath: AbsoluteFilePath;
}): Promise<{ exitCode: ExitCode | null; output: ErrorMessage }> =>
  childProcessSpawnCaptureAdapter({
    command: 'npm',
    args: ['run', 'ward:all'],
    cwd: startPath,
  });
