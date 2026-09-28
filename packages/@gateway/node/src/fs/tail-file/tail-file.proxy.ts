import { watch, createReadStream, statSync, existsSync } from 'fs';
import { dirname } from 'path';
import { createInterface } from 'readline';
import { EventEmitter } from 'events';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { MockHandle } from '@dungeonmaster/testing/register-mock';
import type { PathMatcher } from '../../gateway-test-support/path-matcher';

const EXISTING_FILE_SIZE_BYTES = 128;

interface PathState {
  exists: boolean;
  bytes: number;
  watchers: EventEmitter[];
  lineBatches: (readonly string[])[];
  stalledDrains: number;
  streamErrors: Error[];
  startPositions: (number | undefined)[];
  streams: WeakSet<object>;
}

export const tailFileProxy = (): {
  setupFile: (params: { path: string }) => void;
  triggerChange: (params: { path: string }) => void;
  triggerWatchError: (params: { path: string; error: Error }) => void;
  setupLines: (params: { path: string; lines: readonly string[] }) => void;
  setupNextDrainNeverCloses: (params: { path: string }) => void;
  setupStreamError: (params: { path: string; error: Error }) => void;
  setupStatError: (params: { path: string; error: Error }) => void;
  setupFileMissing: (params: { path: string }) => void;
  setupFileMissingUntilCreated: (params: { path: string }) => void;
  markFileCreated: (params: { path: string }) => void;
  setupExistingFileWithContent: (params: { path: string }) => void;
  setupFileTruncated: (params: { path: string }) => void;
  lastStartPositionWasFromFileEnd: (params: { path: string }) => boolean;
  lastStartPositionWasZero: (params: { path: string }) => boolean;
  getWatchCallsFor: (params: { path: PathMatcher }) => readonly unknown[][];
} => {
  const mockWatch: MockHandle = registerMock({ fn: watch });
  const mockCreateReadStream: MockHandle = registerMock({ fn: createReadStream });
  const mockStatSync: MockHandle = registerMock({ fn: statSync });
  const mockExistsSync: MockHandle = registerMock({ fn: existsSync });
  const mockCreateInterface: MockHandle = registerMock({ fn: createInterface });

  // Every staging is addressed by the file's path, so a call for a path nobody described throws
  // instead of reading as a phantom file. State is a simulated timeline of read cycles per file:
  // the first method called for a path stages that path's mocks, and every later call reuses them.
  const statesByPath = new Map<string, PathState>();

  // One emitter per fs.watch call, like the real thing: `close()` silences it, so a stopped tail
  // hears no further events, and a directory watcher and a file watcher never share listeners.
  const createWatcher = ({
    state,
    listener,
  }: {
    state: PathState;
    listener: () => void;
  }): EventEmitter => {
    const emitter = new EventEmitter();
    const watcher = Object.assign(emitter, {
      close: (): void => {
        emitter.removeAllListeners();
      },
    });
    emitter.on('change', listener);
    state.watchers.push(emitter);
    return watcher;
  };

  const stateFor = ({ path }: { path: string }): PathState => {
    const existing = statesByPath.get(path);
    if (existing) {
      return existing;
    }

    const state: PathState = {
      exists: true,
      bytes: 0,
      watchers: [],
      lineBatches: [],
      stalledDrains: 0,
      streamErrors: [],
      startPositions: [],
      streams: new WeakSet(),
    };
    statesByPath.set(path, state);

    mockExistsSync.calledWith([path]).implement(() => state.exists);

    mockStatSync.calledWith([path]).implement(() => ({ size: state.bytes }));

    mockWatch
      .calledWith([path])
      .implement((_path: string, listener: () => void) => createWatcher({ state, listener }));

    mockCreateReadStream
      .calledWith([path])
      .implement((_path: string, options: { start?: number } | undefined) => {
        state.startPositions.push(options?.start);

        const streamEmitter = new EventEmitter();
        state.streams.add(streamEmitter);

        const errorToEmit = state.streamErrors.shift();
        if (errorToEmit) {
          setImmediate(() => {
            streamEmitter.emit('error', errorToEmit);
          });
        }

        return streamEmitter;
      });

    // createInterface is shared with the readline gateway's own proxy; this path's staging
    // answers only for the streams its own createReadStream handed out.
    mockCreateInterface
      .calledWith([
        {
          input: (value: unknown): boolean =>
            typeof value === 'object' && value !== null && state.streams.has(value),
        },
      ])
      .implement(() => {
        const rlEmitter = Object.assign(new EventEmitter(), { close: jest.fn() });
        const lines = state.lineBatches.shift() ?? [];

        if (state.stalledDrains > 0) {
          state.stalledDrains -= 1;
          return rlEmitter;
        }

        setImmediate(() => {
          for (const line of lines) {
            rlEmitter.emit('line', line);
          }
          rlEmitter.emit('close');
        });

        return rlEmitter;
      });

    return state;
  };

  return {
    setupFile: ({ path }: { path: string }): void => {
      stateFor({ path });
    },

    triggerChange: ({ path }: { path: string }): void => {
      for (const watcher of stateFor({ path }).watchers) {
        watcher.emit('change', 'rename', path);
      }
    },

    triggerWatchError: ({ path, error }: { path: string; error: Error }): void => {
      for (const watcher of stateFor({ path }).watchers) {
        if (watcher.listenerCount('error') > 0) {
          watcher.emit('error', error);
        }
      }
    },

    setupLines: ({ path, lines }: { path: string; lines: readonly string[] }): void => {
      stateFor({ path }).lineBatches.push(lines);
    },

    setupNextDrainNeverCloses: ({ path }: { path: string }): void => {
      stateFor({ path }).stalledDrains += 1;
    },

    setupStreamError: ({ path, error }: { path: string; error: Error }): void => {
      stateFor({ path }).streamErrors.push(error);
    },

    setupStatError: ({ path, error }: { path: string; error: Error }): void => {
      stateFor({ path });
      mockStatSync.onceFor([path]).implement(() => {
        throw error;
      });
    },

    setupFileMissing: ({ path }: { path: string }): void => {
      stateFor({ path });
      mockExistsSync.onceFor([path]).returns(false);
    },

    // The awaitCreate path watches the PARENT directory until the file appears, so the directory
    // is staged too; two files awaiting creation in one directory share it and the later staging
    // answers for both.
    setupFileMissingUntilCreated: ({ path }: { path: string }): void => {
      const state = stateFor({ path });
      state.exists = false;
      mockWatch
        .calledWith([dirname(path)])
        .implement((_path: string, listener: () => void) => createWatcher({ state, listener }));
    },

    markFileCreated: ({ path }: { path: string }): void => {
      stateFor({ path }).exists = true;
    },

    setupExistingFileWithContent: ({ path }: { path: string }): void => {
      stateFor({ path }).bytes = EXISTING_FILE_SIZE_BYTES;
    },

    setupFileTruncated: ({ path }: { path: string }): void => {
      stateFor({ path }).bytes = 0;
    },

    lastStartPositionWasFromFileEnd: ({ path }: { path: string }): boolean => {
      const state = stateFor({ path });
      return state.startPositions.at(-1) === state.bytes && state.bytes > 0;
    },

    lastStartPositionWasZero: ({ path }: { path: string }): boolean =>
      stateFor({ path }).startPositions.at(-1) === 0,

    getWatchCallsFor: ({ path }: { path: PathMatcher }): readonly unknown[][] =>
      mockWatch.callsMatching([path]),
  };
};
