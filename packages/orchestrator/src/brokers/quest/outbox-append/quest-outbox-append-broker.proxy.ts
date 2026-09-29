import { dungeonmasterHomeFindBrokerProxy } from '@dungeonmaster/shared/brokers/dungeonmaster-home/find/dungeonmaster-home-find-broker.proxy';
import type { FilePath } from '@dungeonmaster/shared/contracts';
import { locationsStatics } from '@dungeonmaster/shared/statics';
import { registerMock, registerSpyOn } from '@dungeonmaster/testing/register-mock';
import type { MockHandle } from '@dungeonmaster/testing/register-mock';
import type { FsError } from '#gateway/node/fs';
import { appendFile } from '#gateway/node/fs__promises';
import { appendFileProxy } from '#gateway/node/fs__promises/append-file/append-file.proxy';
import { join } from '#gateway/node/path';

export const questOutboxAppendBrokerProxy = (): {
  setupOutboxAppend: (params: { homePath: FilePath; outboxFilePath: FilePath }) => void;
  setupAppendFailure: (params: {
    homePath: FilePath;
    outboxFilePath: FilePath;
    error: FsError;
  }) => void;
  getAppendedContent: (params: { outboxFilePath: FilePath }) => unknown;
  getAppendedPath: (params: { outboxFilePath: FilePath }) => unknown;
} => {
  const homeFindProxy = dungeonmasterHomeFindBrokerProxy();
  const joinHandle: MockHandle = registerMock({ fn: join });
  // Composed for its lifecycle only: a second `registerMock` on `appendFile` replaces this
  // handle's stubs, so every stub this proxy needs is staged on the one handle below.
  appendFileProxy();
  const appendHandle: MockHandle = registerMock({ fn: appendFile });

  // Every proxy that composes a quest persist reaches this append, and most never stage it: the
  // outbox is addressed by its file name, so an unstaged persist lands quietly while an exact
  // `setupOutboxAppend` / `setupAppendFailure` address stays the one a test can read back.
  const stagedOutboxPaths: FilePath[] = [];
  appendHandle
    .calledWith([
      (value: unknown) =>
        typeof value === 'string' &&
        value.endsWith('outbox.jsonl') &&
        !stagedOutboxPaths.some((staged) => staged === value),
    ])
    .resolves(undefined);

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
      stagedOutboxPaths.push(outboxFilePath);
      homeFindProxy.setupHomePath({ homeDir: '/home/testuser', homePath });
      // questOutboxAppendBroker's own join(homePath, event-outbox.jsonl) -> outboxFilePath,
      // addressed by the exact tuple rather than an address-less FIFO slot, so it can never answer
      // a different broker's join call sharing the same underlying mocked `join`.
      joinHandle
        .calledWith([homePath, locationsStatics.dungeonmasterHome.eventOutbox])
        .returns(outboxFilePath);
      appendHandle.calledWith([outboxFilePath]).resolves(undefined);
    },

    setupAppendFailure: ({
      homePath,
      outboxFilePath,
      error,
    }: {
      homePath: FilePath;
      outboxFilePath: FilePath;
      error: FsError;
    }): void => {
      stagedOutboxPaths.push(outboxFilePath);
      homeFindProxy.setupHomePath({ homeDir: '/home/testuser', homePath });
      joinHandle
        .calledWith([homePath, locationsStatics.dungeonmasterHome.eventOutbox])
        .returns(outboxFilePath);
      // `.implement()`, not `.rejects()`: `.rejects()` coerces a value that is not `instanceof Error`
      // through `new Error(String(val))`, which would drop the error's `code`.
      appendHandle.calledWith([outboxFilePath]).implement(async (): Promise<never> => {
        await Promise.resolve();
        return Promise.reject(error);
      });
    },

    // Address-keyed: proves the append landed on the same outboxFilePath setupOutboxAppend used.
    getAppendedContent: ({ outboxFilePath }: { outboxFilePath: FilePath }): unknown =>
      appendHandle.callsMatching([outboxFilePath]).at(-1)?.[1],

    // questOutboxAppendBroker appends exactly once per call, so the last recorded call is
    // unambiguous — there is no second address it could be confused with.
    getAppendedPath: ({ outboxFilePath }: { outboxFilePath: FilePath }): unknown =>
      appendHandle.callsMatching([outboxFilePath]).at(-1)?.[0],
  };
};
