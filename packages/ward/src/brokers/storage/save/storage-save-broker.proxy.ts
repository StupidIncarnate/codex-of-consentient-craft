import { ensureDirProxy } from '#gateway/node/fs__promises/ensure-dir/ensure-dir.proxy';
import { writeFileProxy } from '#gateway/node/fs__promises/write-file/write-file.proxy';
import { FsErrorStub } from '#gateway/node/fs/is-fs-error/fs-error.stub';
import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';

import type { WardRunResult } from '../../../contracts/ward-result/ward-result-contract';

export const storageSaveBrokerProxy = (): {
  setupSuccess: (params: { rootPath: AbsoluteFilePath; runId: WardRunResult['runId'] }) => void;
  setupMkdirFail: (params: { rootPath: AbsoluteFilePath }) => void;
  setupWriteFail: (params: { rootPath: AbsoluteFilePath; runId: WardRunResult['runId'] }) => void;
  getWrittenContent: (params: { rootPath: AbsoluteFilePath; runId: WardRunResult['runId'] }) => unknown;
} => {
  const mkdirProxy = ensureDirProxy();
  const writeProxy = writeFileProxy();

  return {
    setupSuccess: ({ rootPath, runId }: { rootPath: AbsoluteFilePath; runId: WardRunResult['runId'] }): void => {
      mkdirProxy.succeeds({ path: `${rootPath}/.ward` });
      writeProxy.succeeds({ path: `${rootPath}/.ward/run-${runId}.json` });
    },
    setupMkdirFail: ({ rootPath }: { rootPath: AbsoluteFilePath }): void => {
      const path = `${rootPath}/.ward`;
      mkdirProxy.rejects({ path, error: FsErrorStub({ code: 'EACCES', path, syscall: 'mkdir' }) });
    },
    setupWriteFail: ({ rootPath, runId }: { rootPath: AbsoluteFilePath; runId: WardRunResult['runId'] }): void => {
      const path = `${rootPath}/.ward/run-${runId}.json`;
      mkdirProxy.succeeds({ path: `${rootPath}/.ward` });
      writeProxy.rejects({ path, error: FsErrorStub({ code: 'ENOSPC', path, syscall: 'write' }) });
    },
    getWrittenContent: ({
      rootPath,
      runId,
    }: {
      rootPath: AbsoluteFilePath;
      runId: WardRunResult['runId'];
    }): unknown => writeProxy.writtenContentsFor({ path: `${rootPath}/.ward/run-${runId}.json` }),
  };
};
