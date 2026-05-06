import {
  locationsRateLimitsHistoryPathFindBrokerProxy,
  pathDirnameAdapterProxy,
} from '@dungeonmaster/shared/testing';
import { FilePathStub } from '@dungeonmaster/shared/contracts';

import { fsAppendFileAdapterProxy } from '../../../adapters/fs/append-file/fs-append-file-adapter.proxy';
import { fsMkdirAdapterProxy } from '../../../adapters/fs/mkdir/fs-mkdir-adapter.proxy';

export const rateLimitsHistoryAppendBrokerProxy = (): {
  setupAcceptedAppend: () => void;
  getAppendCalls: () => readonly { path: unknown; content: unknown }[];
} => {
  const mkdirProxy = fsMkdirAdapterProxy();
  const appendProxy = fsAppendFileAdapterProxy();
  const dirnameProxy = pathDirnameAdapterProxy();
  const historyPathProxy = locationsRateLimitsHistoryPathFindBrokerProxy();

  dirnameProxy.returns({
    result: FilePathStub({ value: '/home/test/.dungeonmaster' }),
  });
  historyPathProxy.setupHistoryPath({
    homeDir: '/home/test',
    homePath: FilePathStub({ value: '/home/test/.dungeonmaster' }),
    historyPath: FilePathStub({
      value: '/home/test/.dungeonmaster/rate-limits-history.jsonl',
    }),
  });

  return {
    setupAcceptedAppend: (): void => {
      mkdirProxy.succeeds();
      appendProxy.succeeds();
    },
    getAppendCalls: (): readonly { path: unknown; content: unknown }[] =>
      appendProxy.getAppendCalls(),
  };
};
