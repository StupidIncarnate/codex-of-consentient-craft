jest.mock('fs');
jest.mock('readline');

import { watch, createReadStream, statSync, type FSWatcher } from 'fs';
import { createInterface } from 'readline';
import { EventEmitter } from 'events';

export const fsWatchTailAdapterProxy = (): {
  triggerChange: () => void;
  triggerWatchError: (params: { error: Error }) => void;
  setupLines: (params: { lines: readonly string[] }) => void;
  setupStreamError: (params: { error: Error }) => void;
  setupStatError: (params: { error: Error }) => void;
} => {
  const mockWatch = jest.mocked(watch);
  const mockCreateReadStream = jest.mocked(createReadStream);
  const mockStatSync = jest.mocked(statSync);
  const mockCreateInterface = jest.mocked(createInterface);

  const watchEmitter = Object.assign(new EventEmitter(), {
    close: jest.fn(),
  });
  const watchCallbacks: (() => void)[] = [];
  const pendingLinesBatches: unknown[] = [];
  const pendingStreamErrors: Error[] = [];

  mockStatSync.mockReturnValue({ size: 0 } as ReturnType<typeof statSync>);

  mockWatch.mockImplementation((_path: unknown, listener: unknown) => {
    watchCallbacks.push(listener as () => void);
    return watchEmitter as unknown as FSWatcher;
  });

  mockCreateReadStream.mockImplementation(() => {
    const streamEmitter = new EventEmitter();

    const errorToEmit = pendingStreamErrors.shift();
    if (errorToEmit) {
      setImmediate(() => {
        streamEmitter.emit('error', errorToEmit);
      });
    }

    return streamEmitter as unknown as ReturnType<typeof createReadStream>;
  });

  mockCreateInterface.mockImplementation(() => {
    const rlEmitter = new EventEmitter();
    const batch = pendingLinesBatches.shift();
    const lines = Array.isArray(batch) ? batch : [];

    setImmediate(() => {
      for (const line of lines) {
        rlEmitter.emit('line', line);
      }
      rlEmitter.emit('close');
    });

    return rlEmitter as unknown as ReturnType<typeof createInterface>;
  });

  return {
    triggerChange: (): void => {
      for (const callback of watchCallbacks) {
        callback();
      }
    },

    triggerWatchError: ({ error }: { error: Error }): void => {
      watchEmitter.emit('error', error);
    },

    setupLines: ({ lines }: { lines: readonly string[] }): void => {
      pendingLinesBatches.push(lines);
    },

    setupStreamError: ({ error }: { error: Error }): void => {
      pendingStreamErrors.push(error);
    },

    setupStatError: ({ error }: { error: Error }): void => {
      mockStatSync.mockImplementationOnce(() => {
        throw error;
      });
    },
  };
};
