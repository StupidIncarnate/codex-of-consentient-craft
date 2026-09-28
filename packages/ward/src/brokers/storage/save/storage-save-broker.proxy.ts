import { ensureDirProxy } from '#gateway/node/fs__promises/ensure-dir/ensure-dir.proxy';
import { writeFileProxy } from '#gateway/node/fs__promises/write-file/write-file.proxy';
import { FsErrorStub } from '#gateway/node/fs/is-fs-error/fs-error.stub';
import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

import type { RunId } from '../../../contracts/run-id/run-id-contract';

export const storageSaveBrokerProxy = (): {
  setupSuccess: (params: { rootPath: AbsoluteFilePath; runId: RunId }) => void;
  setupMkdirFail: (params: { rootPath: AbsoluteFilePath }) => void;
  setupWriteFail: (params: { rootPath: AbsoluteFilePath; runId: RunId }) => void;
  getWrittenContent: (params: { rootPath: AbsoluteFilePath; runId: RunId }) => unknown;
} => {
  const mkdirProxy = ensureDirProxy();
  const writeProxy = writeFileProxy();

  return {
    setupSuccess: ({ rootPath, runId }: { rootPath: AbsoluteFilePath; runId: RunId }): void => {
      mkdirProxy.succeeds({ path: `${rootPath}/.ward` });
      writeProxy.succeeds({ path: `${rootPath}/.ward/run-${runId}.json` });
    },
    setupMkdirFail: ({ rootPath }: { rootPath: AbsoluteFilePath }): void => {
      const path = `${rootPath}/.ward`;
      mkdirProxy.rejects({ path, error: FsErrorStub({ code: 'EACCES', path, syscall: 'mkdir' }) });
    },
    setupWriteFail: ({ rootPath, runId }: { rootPath: AbsoluteFilePath; runId: RunId }): void => {
      const path = `${rootPath}/.ward/run-${runId}.json`;
      mkdirProxy.succeeds({ path: `${rootPath}/.ward` });
      writeProxy.rejects({ path, error: FsErrorStub({ code: 'ENOSPC', path, syscall: 'write' }) });
    },
    getWrittenContent: ({
      rootPath,
      runId,
    }: {
      rootPath: AbsoluteFilePath;
      runId: RunId;
    }): unknown => writeProxy.writtenContentsFor({ path: `${rootPath}/.ward/run-${runId}.json` }),
  };
};
