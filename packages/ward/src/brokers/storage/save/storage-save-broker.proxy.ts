import { filePathContract, type AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

import type { RunId } from '../../../contracts/run-id/run-id-contract';
import { fsMkdirAdapterProxy } from '../../../adapters/fs/mkdir/fs-mkdir-adapter.proxy';
import { fsWriteFileAdapterProxy } from '../../../adapters/fs/write-file/fs-write-file-adapter.proxy';

export const storageSaveBrokerProxy = (): {
  setupSuccess: (params: { rootPath: AbsoluteFilePath; runId: RunId }) => void;
  setupMkdirFail: (params: { rootPath: AbsoluteFilePath; error: Error }) => void;
  setupWriteFail: (params: { rootPath: AbsoluteFilePath; runId: RunId; error: Error }) => void;
} => {
  const mkdirProxy = fsMkdirAdapterProxy();
  const writeProxy = fsWriteFileAdapterProxy();

  return {
    setupSuccess: ({ rootPath, runId }: { rootPath: AbsoluteFilePath; runId: RunId }): void => {
      mkdirProxy.succeeds({ dirPath: filePathContract.parse(`${rootPath}/.ward`) });
      writeProxy.succeeds({
        filePath: filePathContract.parse(`${rootPath}/.ward/run-${runId}.json`),
      });
    },
    setupMkdirFail: ({ rootPath, error }: { rootPath: AbsoluteFilePath; error: Error }): void => {
      mkdirProxy.throws({ dirPath: filePathContract.parse(`${rootPath}/.ward`), error });
    },
    setupWriteFail: ({
      rootPath,
      runId,
      error,
    }: {
      rootPath: AbsoluteFilePath;
      runId: RunId;
      error: Error;
    }): void => {
      mkdirProxy.succeeds({ dirPath: filePathContract.parse(`${rootPath}/.ward`) });
      writeProxy.throws({
        filePath: filePathContract.parse(`${rootPath}/.ward/run-${runId}.json`),
        error,
      });
    },
  };
};
