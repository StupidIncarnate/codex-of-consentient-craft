import { dungeonmasterHomeFindBrokerProxy } from '@dungeonmaster/shared/brokers/dungeonmaster-home/find/dungeonmaster-home-find-broker.proxy';
import { locationsStatics } from '@dungeonmaster/shared/statics';
import { registerMock, registerSpyOn } from '@dungeonmaster/testing/register-mock';
import type { MockHandle } from '@dungeonmaster/testing/register-mock';
import type { FsError } from '#gateway/node/fs';
import { appendFileProxy } from '#gateway/node/fs__promises/append-file/append-file.proxy';
import { join } from '#gateway/node/path';

export const questOutboxAppendBrokerProxy = (): {
  setupOutboxAppend: (params: { homePath: string; outboxFilePath: string }) => void;
  setupAppendFailure: (params: {
    homePath: string;
    outboxFilePath: string;
    error: FsError;
  }) => void;
  getAppendedContent: (params: { outboxFilePath: string }) => unknown;
  getAppendedPath: (params: { outboxFilePath: string }) => unknown;
} => {
  const homeFindProxy = dungeonmasterHomeFindBrokerProxy();
  const joinHandle: MockHandle = registerMock({ fn: join });
  const appendProxy = appendFileProxy();

  // Every proxy that composes a quest persist reaches this append, and most never stage it: the
  // outbox is addressed by its file name, so an unstaged persist lands quietly while an exact
  // `setupOutboxAppend` / `setupAppendFailure` address stays the one a test can read back.
  appendProxy.succeedsMatchingPath({
    path: (value: unknown) => typeof value === 'string' && value.endsWith('outbox.jsonl'),
  });

  registerSpyOn({ object: Date.prototype, method: 'toISOString' })
    .calledWith([])
    .returns('2024-01-15T10:00:00.000Z');

  return {
    setupOutboxAppend: ({
      homePath,
      outboxFilePath,
    }: {
      homePath: string;
      outboxFilePath: string;
    }): void => {
      homeFindProxy.setupHomePath({ homeDir: '/home/testuser', homePath });
      // questOutboxAppendBroker's own join(homePath, event-outbox.jsonl) -> outboxFilePath,
      // addressed by the exact tuple rather than an address-less FIFO slot, so it can never answer
      // a different broker's join call sharing the same underlying mocked `join`.
      joinHandle
        .calledWith([homePath, locationsStatics.dungeonmasterHome.eventOutbox])
        .returns(outboxFilePath);
      appendProxy.succeeds({ path: outboxFilePath });
    },

    setupAppendFailure: ({
      homePath,
      outboxFilePath,
      error,
    }: {
      homePath: string;
      outboxFilePath: string;
      error: FsError;
    }): void => {
      homeFindProxy.setupHomePath({ homeDir: '/home/testuser', homePath });
      joinHandle
        .calledWith([homePath, locationsStatics.dungeonmasterHome.eventOutbox])
        .returns(outboxFilePath);
      appendProxy.rejects({ path: outboxFilePath, error });
    },

    // Address-keyed: proves the append landed on the same outboxFilePath setupOutboxAppend used.
    getAppendedContent: ({ outboxFilePath }: { outboxFilePath: string }): unknown =>
      appendProxy.appendedContentsFor({ path: outboxFilePath }),

    // questOutboxAppendBroker appends exactly once per call, so the last recorded call is
    // unambiguous — there is no second address it could be confused with.
    getAppendedPath: ({ outboxFilePath }: { outboxFilePath: string }): unknown =>
      appendProxy.getCallsFor({ path: outboxFilePath }).at(-1)?.[0],
  };
};
