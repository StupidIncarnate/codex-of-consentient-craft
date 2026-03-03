import {
  dungeonmasterHomeFindBrokerProxy,
  pathJoinAdapterProxy,
} from '@dungeonmaster/shared/testing';
import type { FilePath } from '@dungeonmaster/shared/contracts';

import { fsAppendFileAdapterProxy } from '../../../adapters/fs/append-file/fs-append-file-adapter.proxy';

export const questOutboxAppendBrokerProxy = (): {
  setupOutboxAppend: (params: { homePath: FilePath; outboxFilePath: FilePath }) => void;
  setupAppendFailure: (params: {
    homePath: FilePath;
    outboxFilePath: FilePath;
    error: Error;
  }) => void;
  getAppendedContent: () => unknown;
  getAppendedPath: () => unknown;
} => {
  const homeFindProxy = dungeonmasterHomeFindBrokerProxy();
  const pathJoinProxy = pathJoinAdapterProxy();
  const appendFileProxy = fsAppendFileAdapterProxy();

  jest.spyOn(Date.prototype, 'toISOString').mockReturnValue('2024-01-15T10:00:00.000Z');

  return {
    setupOutboxAppend: ({
      homePath,
      outboxFilePath,
    }: {
      homePath: FilePath;
      outboxFilePath: FilePath;
    }): void => {
      homeFindProxy.setupHomePath({ homeDir: '/home/testuser', homePath });
      pathJoinProxy.returns({ result: outboxFilePath });
      appendFileProxy.succeeds();
    },

    setupAppendFailure: ({
      homePath,
      outboxFilePath,
      error,
    }: {
      homePath: FilePath;
      outboxFilePath: FilePath;
      error: Error;
    }): void => {
      homeFindProxy.setupHomePath({ homeDir: '/home/testuser', homePath });
      pathJoinProxy.returns({ result: outboxFilePath });
      appendFileProxy.throws({ error });
    },

    getAppendedContent: (): unknown => appendFileProxy.getAppendedContent(),

    getAppendedPath: (): unknown => appendFileProxy.getAppendedPath(),
  };
};
