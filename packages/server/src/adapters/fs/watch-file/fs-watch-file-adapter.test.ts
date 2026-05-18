import { fsWatchFileAdapter } from './fs-watch-file-adapter';
import { fsWatchFileAdapterProxy } from './fs-watch-file-adapter.proxy';

describe('fsWatchFileAdapter', () => {
  describe('initial drain', () => {
    it('VALID: {file present at start} => onChange fires with contents on setup', () => {
      const proxy = fsWatchFileAdapterProxy();
      proxy.setupFilePresent({ contents: '{"hello":"world"}' });
      const changes: unknown[] = [];

      const handle = fsWatchFileAdapter({
        dirPath: '/tmp/test-dir',
        fileName: 'active-monitor-session.json',
        onChange: ({ contents }): void => {
          changes.push(contents);
        },
        onError: (): void => {
          // no-op
        },
      });
      handle.stop();

      expect(changes).toStrictEqual(['{"hello":"world"}']);
    });

    it('EMPTY: {file absent at start} => onChange fires with null on setup', () => {
      const proxy = fsWatchFileAdapterProxy();
      proxy.setupFileAbsent();
      const changes: unknown[] = [];

      const handle = fsWatchFileAdapter({
        dirPath: '/tmp/test-dir',
        fileName: 'active-monitor-session.json',
        onChange: ({ contents }): void => {
          changes.push(contents);
        },
        onError: (): void => {
          // no-op
        },
      });
      handle.stop();

      expect(changes).toStrictEqual([null]);
    });
  });

  describe('change events', () => {
    it('VALID: {file changes after setup} => onChange fires with new contents', () => {
      const proxy = fsWatchFileAdapterProxy();
      proxy.setupFileAbsent();
      const changes: unknown[] = [];

      const handle = fsWatchFileAdapter({
        dirPath: '/tmp/test-dir',
        fileName: 'active-monitor-session.json',
        onChange: ({ contents }): void => {
          changes.push(contents);
        },
        onError: (): void => {
          // no-op
        },
      });

      proxy.triggerChangeWithContents({ contents: '{"new":"value"}' });
      handle.stop();

      expect(changes).toStrictEqual([null, '{"new":"value"}']);
    });

    it('VALID: {file removed after setup} => onChange fires with null', () => {
      const proxy = fsWatchFileAdapterProxy();
      proxy.setupFilePresent({ contents: '{"a":1}' });
      const changes: unknown[] = [];

      const handle = fsWatchFileAdapter({
        dirPath: '/tmp/test-dir',
        fileName: 'active-monitor-session.json',
        onChange: ({ contents }): void => {
          changes.push(contents);
        },
        onError: (): void => {
          // no-op
        },
      });

      proxy.triggerChangeWithAbsence();
      handle.stop();

      expect(changes).toStrictEqual(['{"a":1}', null]);
    });

    it('VALID: {change event for different file} => onChange NOT fired again', () => {
      const proxy = fsWatchFileAdapterProxy();
      proxy.setupFilePresent({ contents: '{"a":1}' });
      const changes: unknown[] = [];

      const handle = fsWatchFileAdapter({
        dirPath: '/tmp/test-dir',
        fileName: 'active-monitor-session.json',
        onChange: ({ contents }): void => {
          changes.push(contents);
        },
        onError: (): void => {
          // no-op
        },
      });

      proxy.triggerChangeForOtherFile();
      handle.stop();

      expect(changes).toStrictEqual(['{"a":1}']);
    });
  });

  describe('errors', () => {
    it('ERROR: {watcher emits error} => onError fires with the error', () => {
      const proxy = fsWatchFileAdapterProxy();
      proxy.setupFileAbsent();
      const errors: unknown[] = [];

      const handle = fsWatchFileAdapter({
        dirPath: '/tmp/test-dir',
        fileName: 'active-monitor-session.json',
        onChange: (): void => {
          // no-op
        },
        onError: ({ error }): void => {
          errors.push(error);
        },
      });

      const watcherError = new Error('EBADF');
      proxy.triggerWatcherError({ error: watcherError });
      handle.stop();

      expect(errors).toStrictEqual([watcherError]);
    });

    it('ERROR: {readFile throws during change} => onError fires with the error', () => {
      const proxy = fsWatchFileAdapterProxy();
      proxy.setupFilePresent({ contents: '{"a":1}' });
      const errors: unknown[] = [];

      const handle = fsWatchFileAdapter({
        dirPath: '/tmp/test-dir',
        fileName: 'active-monitor-session.json',
        onChange: (): void => {
          // no-op
        },
        onError: ({ error }): void => {
          errors.push(error);
        },
      });

      const readError = new Error('EIO');
      proxy.triggerReadError({ error: readError });
      handle.stop();

      expect(errors).toStrictEqual([readError]);
    });
  });

  describe('stop', () => {
    it('VALID: {stop called} => watcher closes and further events ignored', () => {
      const proxy = fsWatchFileAdapterProxy();
      proxy.setupFilePresent({ contents: '{"a":1}' });
      const changes: unknown[] = [];

      const handle = fsWatchFileAdapter({
        dirPath: '/tmp/test-dir',
        fileName: 'active-monitor-session.json',
        onChange: ({ contents }): void => {
          changes.push(contents);
        },
        onError: (): void => {
          // no-op
        },
      });

      handle.stop();

      proxy.triggerChangeWithContents({ contents: '{"after":"stop"}' });

      expect(changes).toStrictEqual(['{"a":1}']);
    });
  });
});
