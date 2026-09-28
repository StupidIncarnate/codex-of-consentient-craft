import { ensureDirProxy } from '#gateway/node/fs__promises/ensure-dir/ensure-dir.proxy';
import { FsErrorStub } from '#gateway/node/fs/is-fs-error/fs-error.stub';
import { filePathContract, type AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

import type { RunId } from '../../../contracts/run-id/run-id-contract';
import { fsWriteFileAdapterProxy } from '../../../adapters/fs/write-file/fs-write-file-adapter.proxy';

export const storageSaveBrokerProxy = (): {
  setupSuccess: (params: { rootPath: AbsoluteFilePath; runId: RunId }) => void;
  setupMkdirFail: (params: { rootPath: AbsoluteFilePath }) => void;
  setupWriteFail: (params: { rootPath: AbsoluteFilePath; runId: RunId; error: Error }) => void;
} => {
  const mkdirProxy = ensureDirProxy();
  const writeProxy = fsWriteFileAdapterProxy();

  return {
    setupSuccess: ({ rootPath, runId }: { rootPath: AbsoluteFilePath; runId: RunId }): void => {
      mkdirProxy.succeeds({ path: `${rootPath}/.ward` });
      writeProxy.succeeds({
        filePath: filePathContract.parse(`${rootPath}/.ward/run-${runId}.json`),
      });
    },
    setupMkdirFail: ({ rootPath }: { rootPath: AbsoluteFilePath }): void => {
      const path = `${rootPath}/.ward`;
      mkdirProxy.rejects({ path, error: FsErrorStub({ code: 'EACCES', path, syscall: 'mkdir' }) });
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
      mkdirProxy.succeeds({ path: `${rootPath}/.ward` });
      writeProxy.throws({
        filePath: filePathContract.parse(`${rootPath}/.ward/run-${runId}.json`),
        error,
      });
    },
  };
};
