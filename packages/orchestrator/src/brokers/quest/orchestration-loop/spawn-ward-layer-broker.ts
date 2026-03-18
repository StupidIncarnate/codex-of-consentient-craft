/**
 * PURPOSE: Spawns dungeonmaster-ward run and reads structured WardResult JSON from disk
 *
 * USAGE:
 * const result = await spawnWardLayerBroker({startPath: AbsoluteFilePathStub({value: '/project'})});
 * // Returns {exitCode, wardResultJson} where wardResultJson is the parsed ward result or null
 */

import type { AbsoluteFilePath, ExitCode, FileContents } from '@dungeonmaster/shared/contracts';
import { exitCodeContract, filePathContract } from '@dungeonmaster/shared/contracts';

import { childProcessSpawnCaptureAdapter } from '@dungeonmaster/shared/adapters';

import { fsReadFileAdapter } from '../../../adapters/fs/read-file/fs-read-file-adapter';
import { wardOutputToRunIdTransformer } from '../../../transformers/ward-output-to-run-id/ward-output-to-run-id-transformer';

export const spawnWardLayerBroker = async ({
  startPath,
}: {
  startPath: AbsoluteFilePath;
}): Promise<{ exitCode: ExitCode; wardResultJson: FileContents | null }> => {
  const { exitCode: rawExitCode, output } = await childProcessSpawnCaptureAdapter({
    command: 'dungeonmaster-ward',
    args: ['run'],
    cwd: startPath,
  });

  const exitCode = rawExitCode ?? exitCodeContract.parse(1);

  const runId = wardOutputToRunIdTransformer({ output });

  if (!runId) {
    return { exitCode, wardResultJson: null };
  }

  const resultFilePath = filePathContract.parse(`${startPath}/.ward/run-${runId}.json`);

  const wardResultJson = await fsReadFileAdapter({ filePath: resultFilePath });

  return { exitCode, wardResultJson };
};
