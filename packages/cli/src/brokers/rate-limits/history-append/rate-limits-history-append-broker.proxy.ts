import { dirname } from '#gateway/node/path';
import { ensureDirProxy } from '#gateway/node/fs__promises/ensure-dir/ensure-dir.proxy';
import { appendFileProxy } from '#gateway/node/fs__promises/append-file/append-file.proxy';
import { locationsRateLimitsHistoryPathFindBrokerProxy } from '@dungeonmaster/shared/testing';
import { FilePathStub } from '@dungeonmaster/shared/contracts';
import { registerMock } from '@dungeonmaster/testing/register-mock';

export const rateLimitsHistoryAppendBrokerProxy = (): {
  setupAcceptedAppend: () => void;
  getAppendCalls: () => readonly { path: unknown; content: unknown }[];
} => {
  const mkdirProxy = ensureDirProxy();
  const appendProxy = appendFileProxy();
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
      mkdirProxy.succeeds({ path: '/home/test/.dungeonmaster' });
      appendProxy.succeeds({ path: historyPath });
    },
    getAppendCalls: (): readonly { path: unknown; content: unknown }[] => {
      const content = appendProxy.appendedContentsFor({ path: historyPath });
      return content === undefined ? [] : [{ path: historyPath, content }];
    },
  };
};
