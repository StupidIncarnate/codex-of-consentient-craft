import {
  dungeonmasterHomeFindBrokerProxy,
  pathJoinAdapterProxy,
} from '@dungeonmaster/shared/testing';
import type { FilePath } from '@dungeonmaster/shared/contracts';
import { registerSpyOn } from '@dungeonmaster/testing/register-mock';

import { fsAppendFileAdapterProxy } from '../../../adapters/fs/append-file/fs-append-file-adapter.proxy';

export const questOutboxAppendBrokerProxy = (): {
  setupOutboxAppend: (params: { homePath: FilePath; outboxFilePath: FilePath }) => void;
  setupAppendFailure: (params: {
    homePath: FilePath;
    outboxFilePath: FilePath;
    error: Error;
  }) => void;
  getAppendedContent: (params: { outboxFilePath: FilePath }) => unknown;
  getAppendedPath: () => unknown;
} => {
  const homeFindProxy = dungeonmasterHomeFindBrokerProxy();
  const pathJoinProxy = pathJoinAdapterProxy();
  const appendFileProxy = fsAppendFileAdapterProxy();

  registerSpyOn({ object: Date.prototype, method: 'toISOString' })
    .calledWith([])
    .returns('2024-01-15T10:00:00.000Z');

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
      appendFileProxy.succeeds({ filePath: outboxFilePath });
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
      appendFileProxy.throws({ filePath: outboxFilePath, error });
    },

    // Address-keyed: proves the append landed on the same outboxFilePath setupOutboxAppend used.
    getAppendedContent: ({ outboxFilePath }: { outboxFilePath: FilePath }): unknown =>
      appendFileProxy.getAppendedFor({ filePath: outboxFilePath }),

    // questOutboxAppendBroker appends exactly once per call, so the last recorded call is
    // unambiguous — there is no second address it could be confused with.
    getAppendedPath: (): unknown => appendFileProxy.getAllAppendedFiles().at(-1)?.path,
  };
};
