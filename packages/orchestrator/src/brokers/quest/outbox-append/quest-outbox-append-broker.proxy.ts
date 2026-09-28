import { dungeonmasterHomeFindBrokerProxy } from '@dungeonmaster/shared/testing';
import type { FilePath } from '@dungeonmaster/shared/contracts';
import { locationsStatics } from '@dungeonmaster/shared/statics';
import { registerMock, registerSpyOn } from '@dungeonmaster/testing/register-mock';
import type { MockHandle } from '@dungeonmaster/testing/register-mock';
import { join } from '#gateway/node/path';

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
  const joinHandle: MockHandle = registerMock({ fn: join });
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
      // questOutboxAppendBroker's own join(homePath, event-outbox.jsonl) -> outboxFilePath,
      // addressed by the exact tuple rather than an address-less FIFO slot, so it can never answer
      // a different broker's join call sharing the same underlying mocked `join`.
      joinHandle
        .calledWith([homePath, locationsStatics.dungeonmasterHome.eventOutbox])
        .returns(outboxFilePath);
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
      joinHandle
        .calledWith([homePath, locationsStatics.dungeonmasterHome.eventOutbox])
        .returns(outboxFilePath);
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
