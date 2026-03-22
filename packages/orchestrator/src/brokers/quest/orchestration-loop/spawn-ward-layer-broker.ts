/**
 * PURPOSE: Spawns dungeonmaster-ward with streaming output and returns exit code + run ID
 *
 * USAGE:
 * const result = await spawnWardLayerBroker({startPath, wardMode: 'changed', onLine: (line) => emit(line)});
 * // Returns {exitCode, runId} — runId extracted from stdout for subsequent `ward detail` calls
 */

import type { AbsoluteFilePath, ExitCode, FileName } from '@dungeonmaster/shared/contracts';
import { exitCodeContract } from '@dungeonmaster/shared/contracts';

import { childProcessSpawnStreamLinesAdapter } from '@dungeonmaster/shared/adapters';

import { wardOutputToRunIdTransformer } from '../../../transformers/ward-output-to-run-id/ward-output-to-run-id-transformer';

const WARD_COMMAND = 'dungeonmaster-ward';

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

  const { exitCode: rawExitCode, output } = await childProcessSpawnStreamLinesAdapter({
    command: process.env.WARD_CLI_PATH ?? WARD_COMMAND,
    args,
    cwd: startPath,
    ...(onLine === undefined ? {} : { onLine }),
  });

  const exitCode = rawExitCode ?? exitCodeContract.parse(1);

  const runId = wardOutputToRunIdTransformer({ output });

  return { exitCode, runId };
};
