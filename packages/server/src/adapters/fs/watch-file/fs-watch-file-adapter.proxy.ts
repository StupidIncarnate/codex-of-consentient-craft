import { watch, readFileSync, existsSync, mkdirSync, type FSWatcher } from 'fs';
import { EventEmitter } from 'events';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import type { MockHandle } from '@dungeonmaster/testing/register-mock';

type WatchCallback = (event: string, fileName: string | null) => void;

export const fsWatchFileAdapterProxy = (): {
  setupFilePresent: (params: { contents: string }) => void;
  setupFileAbsent: () => void;
  triggerChangeWithContents: (params: { contents: string }) => void;
  triggerChangeWithAbsence: () => void;
  triggerChangeForOtherFile: () => void;
  triggerWatcherError: (params: { error: Error }) => void;
  triggerReadError: (params: { error: Error }) => void;
} => {
  const mockWatch: MockHandle = registerMock({ fn: watch });
  const mockReadFileSync: MockHandle = registerMock({ fn: readFileSync });
  const mockExistsSync: MockHandle = registerMock({ fn: existsSync });
  const mockMkdirSync: MockHandle = registerMock({ fn: mkdirSync });

  const watchEmitter = Object.assign(new EventEmitter(), {
    close: jest.fn(),
  });
  const watchCallbacks: WatchCallback[] = [];

  // Tracks the target filename so triggerChange can pass it. Captured from the first
  // mockWatch call. The proxy assumes a single watcher per test.
  const watchedFileName = { current: '' };

  // Default behavior: directory exists, file is absent. Tests override with setupFilePresent.
  const fileState = { present: false, contents: '' };

  mockMkdirSync.mockImplementation(() => undefined);

  mockExistsSync.mockImplementation((path: unknown) => {
    const pathStr = String(path);
    if (pathStr.endsWith(`/${watchedFileName.current}`)) {
      return fileState.present;
    }
    // Directory exists check — always true under the proxy.
    return true;
  });

  mockReadFileSync.mockImplementation(() => fileState.contents);

  mockWatch.mockImplementation((_dirPath: unknown, callback: unknown) => {
    // Tests configure watchedFileName via setupFilePresent / setupFileAbsent calls; the
    // dir-path is ignored by the proxy (real adapter would resolve files under it).
    watchCallbacks.push(callback as WatchCallback);
    return watchEmitter as unknown as FSWatcher;
  });

  return {
    setupFilePresent: ({ contents }: { contents: string }): void => {
      fileState.present = true;
      fileState.contents = contents;
      // Watched filename derived from the contents-equality is unsafe; tests should call
      // setupFilePresent BEFORE invoking the adapter so the initial drain emits this
      // content. We assume the adapter target is `active-monitor-session.json` for
      // monitor-session-watch responder tests. Other tests can override via the trigger
      // helpers which always pass the active filename.
      watchedFileName.current = 'active-monitor-session.json';
    },
    setupFileAbsent: (): void => {
      fileState.present = false;
      fileState.contents = '';
      watchedFileName.current = 'active-monitor-session.json';
    },
    triggerChangeWithContents: ({ contents }: { contents: string }): void => {
      fileState.present = true;
      fileState.contents = contents;
      for (const callback of watchCallbacks) {
        callback('change', watchedFileName.current);
      }
    },
    triggerChangeWithAbsence: (): void => {
      fileState.present = false;
      fileState.contents = '';
      for (const callback of watchCallbacks) {
        callback('rename', watchedFileName.current);
      }
    },
    triggerChangeForOtherFile: (): void => {
      // Simulates fs.watch firing for an unrelated file in the same dir — the adapter
      // must filter it out and NOT invoke onChange.
      for (const callback of watchCallbacks) {
        callback('change', 'other-file.txt');
      }
    },
    triggerWatcherError: ({ error }: { error: Error }): void => {
      watchEmitter.emit('error', error);
    },
    triggerReadError: ({ error }: { error: Error }): void => {
      mockReadFileSync.mockImplementationOnce(() => {
        throw error;
      });
      // Force a change so the read happens
      for (const callback of watchCallbacks) {
        callback('change', watchedFileName.current);
      }
    },
  };
};
