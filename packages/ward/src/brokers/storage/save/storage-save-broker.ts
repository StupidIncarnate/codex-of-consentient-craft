/**
 * PURPOSE: Writes a WardResult as JSON to .ward/run-<id>.json in the project root
 *
 * USAGE:
 * await storageSaveBroker({ rootPath: AbsoluteFilePathStub({ value: '/project' }), wardResult: WardResultStub() });
 * // Creates .ward/run-1739625600000-a3f1.json with serialized WardResult
 */

import {
  fileContentsContract,
  filePathContract,
  type AbsoluteFilePath,
} from '@dungeonmaster/shared/contracts';

import type { WardResult } from '../../../contracts/ward-result/ward-result-contract';
import { fsMkdirAdapter } from '../../../adapters/fs/mkdir/fs-mkdir-adapter';
import { fsWriteFileAdapter } from '../../../adapters/fs/write-file/fs-write-file-adapter';

export const storageSaveBroker = async ({
  rootPath,
  wardResult,
}: {
  rootPath: AbsoluteFilePath;
  wardResult: WardResult;
}): Promise<void> => {
  const slim = {
    ...wardResult,
    checks: wardResult.checks.map((check) => ({
      ...check,
      projectResults: check.projectResults.map(({ rawOutput: _rawOutput, ...rest }) => rest),
    })),
  };

  const wardDir = filePathContract.parse(`${rootPath}/.ward`);
  await fsMkdirAdapter({ dirPath: wardDir });

  const filePath = filePathContract.parse(`${rootPath}/.ward/run-${wardResult.runId}.json`);
  const contents = fileContentsContract.parse(JSON.stringify(slim));

  await fsWriteFileAdapter({ filePath, contents });
};
