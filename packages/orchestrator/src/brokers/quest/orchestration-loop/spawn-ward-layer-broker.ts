/**
 * PURPOSE: Spawns dungeonmaster-ward with streaming output and returns exit code + run ID
 *
 * USAGE:
 * const result = await spawnWardLayerBroker({startPath, wardMode: 'changed', onLine: (line) => emit(line)});
 * // Returns {exitCode, runId} — runId extracted from stdout for subsequent `ward detail` calls
 */

import type { AbsoluteFilePath, ExitCode, FileName } from '@dungeonmaster/shared/contracts';
import { exitCodeContract } from '@dungeonmaster/shared/contracts';

import { childProcessSpawnCaptureAdapter } from '@dungeonmaster/shared/adapters';

import { wardOutputToRunIdTransformer } from '../../../transformers/ward-output-to-run-id/ward-output-to-run-id-transformer';

export const spawnWardLayerBroker = async ({
  startPath,
  wardMode,
  onLine,
}: {
  startPath: AbsoluteFilePath;
  wardMode?: 'changed' | 'full';
  onLine?: (line: string) => void;
}): Promise<{ exitCode: ExitCode; runId: FileName | null }> => {
  const args = wardMode === 'changed' ? ['run', '--changed'] : ['run'];

  const { exitCode: rawExitCode, output } = await childProcessSpawnCaptureAdapter({
    command: 'dungeonmaster-ward',
    args,
    cwd: startPath,
  });

  // Replay captured output line-by-line for streaming consumers
  if (onLine) {
    const lines = String(output).split('\n');
    for (const line of lines) {
      if (line.length > 0) {
        onLine(line);
      }
    }
  }

  const exitCode = rawExitCode ?? exitCodeContract.parse(1);

  const runId = wardOutputToRunIdTransformer({ output });

  return { exitCode, runId };
};
