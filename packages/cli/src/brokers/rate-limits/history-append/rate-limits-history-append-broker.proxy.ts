import { dirname } from '#gateway/node/path';
import { locationsRateLimitsHistoryPathFindBrokerProxy } from '@dungeonmaster/shared/testing';
import { FilePathStub } from '@dungeonmaster/shared/contracts';
import { registerMock } from '@dungeonmaster/testing/register-mock';

import { fsAppendFileAdapterProxy } from '../../../adapters/fs/append-file/fs-append-file-adapter.proxy';
import { fsMkdirAdapterProxy } from '../../../adapters/fs/mkdir/fs-mkdir-adapter.proxy';

export const rateLimitsHistoryAppendBrokerProxy = (): {
  setupAcceptedAppend: () => void;
  getAppendCalls: () => readonly { path: unknown; content: unknown }[];
} => {
  const mkdirProxy = fsMkdirAdapterProxy();
  const appendProxy = fsAppendFileAdapterProxy();
  const dirnameHandle = registerMock({ fn: dirname });
  const historyPathProxy = locationsRateLimitsHistoryPathFindBrokerProxy();

  const historyPath = FilePathStub({
    value: '/home/test/.dungeonmaster/rate-limits-history.jsonl',
  });

  dirnameHandle
    .calledWith([historyPath])
    .returns(FilePathStub({ value: '/home/test/.dungeonmaster' }));
  historyPathProxy.setupHistoryPath({
    homeDir: '/home/test',
    homePath: FilePathStub({ value: '/home/test/.dungeonmaster' }),
    historyPath,
  });

  return {
    setupAcceptedAppend: (): void => {
      mkdirProxy.succeeds({ filePath: FilePathStub({ value: '/home/test/.dungeonmaster' }) });
      appendProxy.succeeds({ filePath: historyPath });
    },
    getAppendCalls: (): readonly { path: unknown; content: unknown }[] =>
      appendProxy.getAppendCalls(),
  };
};
