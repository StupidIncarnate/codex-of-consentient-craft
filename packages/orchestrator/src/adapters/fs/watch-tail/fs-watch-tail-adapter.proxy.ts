import { watch, createReadStream, statSync, existsSync, type FSWatcher } from 'fs';
import { createInterface } from 'readline';
import { EventEmitter } from 'events';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { MockHandle } from '@dungeonmaster/testing/register-mock';

const EXISTING_FILE_SIZE_BYTES = 128;

export const fsWatchTailAdapterProxy = (): {
  triggerChange: () => void;
  triggerWatchError: (params: { error: Error }) => void;
  setupLines: (params: { lines: readonly string[] }) => void;
  setupStreamError: (params: { error: Error }) => void;
  setupStatError: (params: { error: Error }) => void;
  setupFileMissing: () => void;
  setupFileMissingUntilCreated: () => void;
  markFileCreated: () => void;
  setupExistingFileWithContent: () => void;
  lastStartPositionWasFromFileEnd: () => boolean;
  lastStartPositionWasZero: () => boolean;
} => {
  const mockWatch: MockHandle = registerMock({ fn: watch });
  const mockCreateReadStream: MockHandle = registerMock({ fn: createReadStream });
  const mockStatSync: MockHandle = registerMock({ fn: statSync });
  const mockExistsSync: MockHandle = registerMock({ fn: existsSync });
  const mockCreateInterface: MockHandle = registerMock({ fn: createInterface });

  // No call here can be addressed by filePath: this proxy composes into 6+ broker
  // proxies that construct `fsWatchTailAdapterProxy()` with no arguments, before any
  // test-specific path exists (the real path is computed deep inside the broker under
  // test from guild config + homedir + sessionId). Every call is staged as `[]` and
  // behavior is modeled as a simulated timeline of read cycles on a single fake file,
  // not as per-path routing — see the "registerMock collision" comments in the broker
  // proxies that compose this one for why several of them share one such timeline.

  // Default: file always exists. Tests opt into the missing-file path via setupFileMissing
  // (one-shot ENOENT at setup) or setupFileMissingUntilCreated + markFileCreated (the
  // awaitCreate path, where the file appears a beat after construction).
  const existsState = { exists: true };
  mockExistsSync.calledWith([]).implement(() => existsState.exists);

  const watchEmitter = Object.assign(new EventEmitter(), {
    close: jest.fn(),
  });
  const watchCallbacks: (() => void)[] = [];
  const pendingLinesBatches: unknown[] = [];
  const pendingStreamErrors: Error[] = [];
  const recordedStartPositions: unknown[] = [];
  const fileSizeState = { bytes: 0 };

  mockStatSync
    .calledWith([])
    .implement(() => ({ size: fileSizeState.bytes }) as ReturnType<typeof statSync>);

  mockWatch.calledWith([]).implement((_path: unknown, listener: unknown) => {
    watchCallbacks.push(listener as () => void);
    return watchEmitter as unknown as FSWatcher;
  });

  // createInterface is a SHARED npm function — readlineCreateInterfaceAdapterProxy also
  // mocks it (for the live Claude CLI stdout stream). Each proxy keys its staging on the
  // `input` stream's identity/type rather than leaving it an address-less catch-all, so the
  // two calls route independently of construction order. This adapter's own createInterface
  // call always receives the stream ITS OWN mocked createReadStream returned (a bare
  // EventEmitter, never a real `stream.Readable`), so tracking those streams below gives
  // this staging a real address — see isTrackedReadStream.
  const trackedReadStreams = new WeakSet();

  mockCreateReadStream.calledWith([]).implement((_path: unknown, options: unknown) => {
    const opts = options as { start?: unknown } | undefined;
    recordedStartPositions.push(opts?.start);

    const streamEmitter = new EventEmitter();
    trackedReadStreams.add(streamEmitter);

    const errorToEmit = pendingStreamErrors.shift();
    if (errorToEmit) {
      setImmediate(() => {
        streamEmitter.emit('error', errorToEmit);
      });
    }

    return streamEmitter as unknown as ReturnType<typeof createReadStream>;
  });

  const isTrackedReadStream = (value: unknown): boolean =>
    typeof value === 'object' && value !== null && trackedReadStreams.has(value);

  mockCreateInterface.calledWith([{ input: isTrackedReadStream }]).implement(() => {
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
      mockStatSync.onceFor([]).implement(() => {
        throw error;
      });
    },

    setupFileMissing: (): void => {
      mockExistsSync.onceFor([]).returns(false);
    },

    setupFileMissingUntilCreated: (): void => {
      existsState.exists = false;
    },

    markFileCreated: (): void => {
      existsState.exists = true;
    },

    setupExistingFileWithContent: (): void => {
      fileSizeState.bytes = EXISTING_FILE_SIZE_BYTES;
    },

    lastStartPositionWasFromFileEnd: (): boolean => {
      const last = recordedStartPositions[recordedStartPositions.length - 1];
      return last === fileSizeState.bytes && fileSizeState.bytes > 0;
    },

    lastStartPositionWasZero: (): boolean => {
      const last = recordedStartPositions[recordedStartPositions.length - 1];
      return last === 0;
    },
  };
};
