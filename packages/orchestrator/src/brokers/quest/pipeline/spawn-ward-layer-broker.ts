/**
 * PURPOSE: Spawns dungeonmaster-ward run and reads structured WardResult JSON from disk
 *
 * USAGE:
 * const result = await spawnWardLayerBroker({ startPath: AbsoluteFilePathStub({ value: '/project' }) });
 * // Returns { exitCode: ExitCode | null, wardResultJson: FileContents | null }
 */

import type { AbsoluteFilePath, ExitCode, FileContents } from '@dungeonmaster/shared/contracts';
import { filePathContract } from '@dungeonmaster/shared/contracts';

import { childProcessSpawnCaptureAdapter } from '@dungeonmaster/shared/adapters';

import { fsReadFileAdapter } from '../../../adapters/fs/read-file/fs-read-file-adapter';
import { wardOutputToRunIdTransformer } from '../../../transformers/ward-output-to-run-id/ward-output-to-run-id-transformer';

export const spawnWardLayerBroker = async ({
  startPath,
}: {
  startPath: AbsoluteFilePath;
}): Promise<{ exitCode: ExitCode | null; wardResultJson: FileContents | null }> => {
  const { exitCode, output } = await childProcessSpawnCaptureAdapter({
    command: 'dungeonmaster-ward',
    args: ['run'],
    cwd: startPath,
  });

  const runId = wardOutputToRunIdTransformer({ output });

  if (!runId) {
    return { exitCode, wardResultJson: null };
  }

  const resultFilePath = filePathContract.parse(`${startPath}/.ward/run-${runId}.json`);

  const wardResultJson = await fsReadFileAdapter({ filePath: resultFilePath });

  return { exitCode, wardResultJson };
};
