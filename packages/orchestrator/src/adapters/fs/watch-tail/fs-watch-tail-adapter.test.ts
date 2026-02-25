import { fsWatchTailAdapter } from './fs-watch-tail-adapter';
import { fsWatchTailAdapterProxy } from './fs-watch-tail-adapter.proxy';
import { AbsoluteFilePathStub } from '@dungeonmaster/shared/contracts';

const flushPromises = async (): Promise<void> =>
  new Promise((resolve) => {
    setImmediate(resolve);
  });

describe('fsWatchTailAdapter', () => {
  describe('line reading', () => {
    it('VALID: single line appended => calls onLine with that line', async () => {
      const proxy = fsWatchTailAdapterProxy();
      const filePath = AbsoluteFilePathStub({ value: '/tmp/test.jsonl' });
      const onLine = jest.fn();
      const onError = jest.fn();

      fsWatchTailAdapter({
        filePath,
        onLine,
        onError,
      });

      proxy.setupLines({ lines: ['{"type":"message"}'] });
      proxy.triggerChange();
      await flushPromises();

      expect(onLine).toHaveBeenCalledTimes(1);
      expect(onLine).toHaveBeenNthCalledWith(1, { line: '{"type":"message"}' });
      expect(onError).toHaveBeenCalledTimes(0);
    });

    it('VALID: multiple lines appended at once => calls onLine for each line', async () => {
      const proxy = fsWatchTailAdapterProxy();
      const filePath = AbsoluteFilePathStub({ value: '/tmp/test.jsonl' });
      const onLine = jest.fn();

      fsWatchTailAdapter({
        filePath,
        onLine,
        onError: () => {},
      });

      proxy.setupLines({ lines: ['line-one', 'line-two', 'line-three'] });
      proxy.triggerChange();
      await flushPromises();

      expect(onLine).toHaveBeenCalledTimes(3);
      expect(onLine).toHaveBeenNthCalledWith(1, { line: 'line-one' });
      expect(onLine).toHaveBeenNthCalledWith(2, { line: 'line-two' });
      expect(onLine).toHaveBeenNthCalledWith(3, { line: 'line-three' });
    });

    it('EDGE: empty lines are skipped => onLine not called for empty strings', async () => {
      const proxy = fsWatchTailAdapterProxy();
      const filePath = AbsoluteFilePathStub({ value: '/tmp/test.jsonl' });
      const onLine = jest.fn();

      fsWatchTailAdapter({
        filePath,
        onLine,
        onError: () => {},
      });

      proxy.setupLines({ lines: ['', 'non-empty', ''] });
      proxy.triggerChange();
      await flushPromises();

      expect(onLine).toHaveBeenCalledTimes(1);
      expect(onLine).toHaveBeenNthCalledWith(1, { line: 'non-empty' });
    });
  });

  describe('stop handle', () => {
    it('VALID: stop() called => watcher is closed and no more lines emitted', async () => {
      const proxy = fsWatchTailAdapterProxy();
      const filePath = AbsoluteFilePathStub({ value: '/tmp/test.jsonl' });
      const onLine = jest.fn();

      const handle = fsWatchTailAdapter({
        filePath,
        onLine,
        onError: () => {},
      });

      handle.stop();

      proxy.setupLines({ lines: ['should-not-appear'] });
      proxy.triggerChange();
      await flushPromises();

      expect(onLine).toHaveBeenCalledTimes(0);
    });
  });

  describe('error handling', () => {
    it('ERROR: watcher emits error => calls onError', () => {
      const proxy = fsWatchTailAdapterProxy();
      const filePath = AbsoluteFilePathStub({ value: '/tmp/test.jsonl' });
      const onError = jest.fn();

      fsWatchTailAdapter({
        filePath,
        onLine: () => {},
        onError,
      });

      const watchError = new Error('ENOENT: file removed');
      proxy.triggerWatchError({ error: watchError });

      expect(onError).toHaveBeenCalledTimes(1);
      expect(onError).toHaveBeenNthCalledWith(1, { error: watchError });
    });

    it('ERROR: stream error during read => calls onError', async () => {
      const proxy = fsWatchTailAdapterProxy();
      const filePath = AbsoluteFilePathStub({ value: '/tmp/test.jsonl' });
      const onError = jest.fn();

      fsWatchTailAdapter({
        filePath,
        onLine: () => {},
        onError,
      });

      const streamError = new Error('EACCES: permission denied');
      proxy.setupStreamError({ error: streamError });
      proxy.triggerChange();
      await flushPromises();

      expect(onError).toHaveBeenCalledTimes(1);
      expect(onError).toHaveBeenNthCalledWith(1, { error: streamError });
    });

    it('ERROR: watcher error after stop => onError not called', () => {
      const proxy = fsWatchTailAdapterProxy();
      const filePath = AbsoluteFilePathStub({ value: '/tmp/test.jsonl' });
      const onError = jest.fn();

      const handle = fsWatchTailAdapter({
        filePath,
        onLine: () => {},
        onError,
      });

      handle.stop();

      proxy.triggerWatchError({ error: new Error('should-not-appear') });

      expect(onError).toHaveBeenCalledTimes(0);
    });
  });
});
