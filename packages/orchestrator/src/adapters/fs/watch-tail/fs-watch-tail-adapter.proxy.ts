import { watch, createReadStream, statSync, type FSWatcher } from 'fs';
import { createInterface } from 'readline';
import { EventEmitter } from 'events';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { MockHandle } from '@dungeonmaster/testing/register-mock';

export const fsWatchTailAdapterProxy = (): {
  triggerChange: () => void;
  triggerWatchError: (params: { error: Error }) => void;
  setupLines: (params: { lines: readonly string[] }) => void;
  setupStreamError: (params: { error: Error }) => void;
  setupStatError: (params: { error: Error }) => void;
} => {
  const mockWatch: MockHandle = registerMock({ fn: watch });
  const mockCreateReadStream: MockHandle = registerMock({ fn: createReadStream });
  const mockStatSync: MockHandle = registerMock({ fn: statSync });
  const mockCreateInterface: MockHandle = registerMock({ fn: createInterface });

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
    const rlEmitter = Object.assign(new EventEmitter(), {
      close: jest.fn(),
    });
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
