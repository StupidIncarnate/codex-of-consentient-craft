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

  describe('concurrent read guard', () => {
    it('EDGE: second change event while reading => ignored until first read completes', async () => {
      const proxy = fsWatchTailAdapterProxy();
      const filePath = AbsoluteFilePathStub({ value: '/tmp/test.jsonl' });
      const onLine = jest.fn();

      fsWatchTailAdapter({
        filePath,
        onLine,
        onError: () => {},
      });

      proxy.setupLines({ lines: ['first-batch'] });
      proxy.triggerChange();
      proxy.triggerChange();
      await flushPromises();

      expect(onLine).toHaveBeenCalledTimes(1);
      expect(onLine).toHaveBeenNthCalledWith(1, { line: 'first-batch' });
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

  describe('startPosition parameter', () => {
    it("VALID: {startPosition: 'end', existing file content} => createReadStream starts at file size so existing content is skipped", async () => {
      const proxy = fsWatchTailAdapterProxy();
      const filePath = AbsoluteFilePathStub({ value: '/tmp/test.jsonl' });
      const onLine = jest.fn();

      proxy.setupExistingFileWithContent();

      fsWatchTailAdapter({
        filePath,
        onLine,
        onError: () => {},
        startPosition: 'end',
      });

      proxy.setupLines({ lines: ['appended-after-start'] });
      proxy.triggerChange();
      await flushPromises();

      expect(proxy.lastStartPositionWasFromFileEnd()).toBe(true);
      expect(onLine).toHaveBeenCalledTimes(1);
      expect(onLine).toHaveBeenNthCalledWith(1, { line: 'appended-after-start' });
    });

    it("VALID: {startPosition: 'beginning', existing file content} => createReadStream starts at 0 so existing content is drained", async () => {
      const proxy = fsWatchTailAdapterProxy();
      const filePath = AbsoluteFilePathStub({ value: '/tmp/test.jsonl' });
      const onLine = jest.fn();

      proxy.setupExistingFileWithContent();

      fsWatchTailAdapter({
        filePath,
        onLine,
        onError: () => {},
        startPosition: 'beginning',
      });

      proxy.setupLines({ lines: ['drained-from-start'] });
      proxy.triggerChange();
      await flushPromises();

      expect(proxy.lastStartPositionWasZero()).toBe(true);
      expect(onLine).toHaveBeenCalledTimes(1);
      expect(onLine).toHaveBeenNthCalledWith(1, { line: 'drained-from-start' });
    });

    it('EDGE: {startPosition omitted, existing file content} => defaults to 0 (beginning) and drains existing content', async () => {
      const proxy = fsWatchTailAdapterProxy();
      const filePath = AbsoluteFilePathStub({ value: '/tmp/test.jsonl' });
      const onLine = jest.fn();

      proxy.setupExistingFileWithContent();

      fsWatchTailAdapter({
        filePath,
        onLine,
        onError: () => {},
      });

      proxy.setupLines({ lines: ['default-drain'] });
      proxy.triggerChange();
      await flushPromises();

      expect(proxy.lastStartPositionWasZero()).toBe(true);
      expect(onLine).toHaveBeenCalledTimes(1);
      expect(onLine).toHaveBeenNthCalledWith(1, { line: 'default-drain' });
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

    it('ERROR: statSync fails on close => calls onError', async () => {
      const proxy = fsWatchTailAdapterProxy();
      const filePath = AbsoluteFilePathStub({ value: '/tmp/test.jsonl' });
      const onError = jest.fn();

      fsWatchTailAdapter({
        filePath,
        onLine: () => {},
        onError,
      });

      proxy.setupLines({ lines: ['data'] });
      proxy.setupStatError({ error: new Error('ENOENT: file deleted') });
      proxy.triggerChange();
      await flushPromises();

      expect(onError).toHaveBeenCalledTimes(1);
      expect(onError).toHaveBeenNthCalledWith(1, { error: new Error('ENOENT: file deleted') });
    });

    it('ERROR: statSync fails on close after stop => onError not called', async () => {
      const proxy = fsWatchTailAdapterProxy();
      const filePath = AbsoluteFilePathStub({ value: '/tmp/test.jsonl' });
      const onError = jest.fn();

      const handle = fsWatchTailAdapter({
        filePath,
        onLine: () => {},
        onError,
      });

      proxy.setupLines({ lines: ['data'] });
      proxy.setupStatError({ error: new Error('ENOENT: file deleted') });
      handle.stop();
      proxy.triggerChange();
      await flushPromises();

      expect(onError).toHaveBeenCalledTimes(0);
    });

    it('ERROR: stream error after stop => onError not called', async () => {
      const proxy = fsWatchTailAdapterProxy();
      const filePath = AbsoluteFilePathStub({ value: '/tmp/test.jsonl' });
      const onError = jest.fn();

      const handle = fsWatchTailAdapter({
        filePath,
        onLine: () => {},
        onError,
      });

      proxy.setupStreamError({ error: new Error('EACCES') });
      handle.stop();
      proxy.triggerChange();
      await flushPromises();

      expect(onError).toHaveBeenCalledTimes(0);
    });
  });

  describe('initialDrain promise', () => {
    // The initialDrain contract closes the resolve-race in chat-start-responder.onComplete
    // — onComplete must NOT iterate stop handles until every in-flight tail's drain has
    // delivered every pre-existing line. Without this guard the readline 'line' event
    // queued by the synthetic-emit drain fires AFTER state.stopped was flipped, and the
    // line is dropped at the gate inside `rl.on('line')`. The test below proves the
    // guarantee: lines are delivered to onLine BEFORE initialDrain resolves.
    it('VALID: pre-existing file content drained => initialDrain resolves AFTER every line has been delivered to onLine', async () => {
      const proxy = fsWatchTailAdapterProxy();
      const filePath = AbsoluteFilePathStub({ value: '/tmp/test.jsonl' });
      const onLine = jest.fn();

      const handle = fsWatchTailAdapter({
        filePath,
        onLine,
        onError: () => {},
      });

      proxy.setupLines({ lines: ['line-a', 'line-b', 'line-c'] });
      proxy.triggerChange();
      await handle.initialDrain;

      expect(onLine).toHaveBeenCalledTimes(3);
      expect(onLine).toHaveBeenNthCalledWith(1, { line: 'line-a' });
      expect(onLine).toHaveBeenNthCalledWith(2, { line: 'line-b' });
      expect(onLine).toHaveBeenNthCalledWith(3, { line: 'line-c' });
    });

    it('VALID: stop() called before any drain runs => initialDrain still resolves so awaiters do not hang', async () => {
      fsWatchTailAdapterProxy();
      const filePath = AbsoluteFilePathStub({ value: '/tmp/test.jsonl' });
      const onLine = jest.fn();

      const handle = fsWatchTailAdapter({
        filePath,
        onLine,
        onError: () => {},
      });

      handle.stop();

      // If stop() did not resolve initialDrain, this await would hang forever — the test
      // would time out instead of pass. The default jest timeout would catch it but we
      // don't want to rely on that; the guarantee is "stop unblocks the promise".
      await handle.initialDrain;

      // No drain ever ran (triggerChange was never called), so onLine was never invoked.
      expect(onLine).toHaveBeenCalledTimes(0);
    });
  });
});
