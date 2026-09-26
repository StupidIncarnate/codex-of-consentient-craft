import { tailFile } from './tail-file';
import { tailFileProxy } from './tail-file.proxy';
import { registerSpyOn } from '@dungeonmaster/testing/register-mock';

const flushPromises = async (): Promise<void> =>
  new Promise((resolve) => {
    setImmediate(resolve);
  });

const XML_FAILURE_PREFIX = '[tail-file] onLine failed for /tmp/test.jsonl: ';
const CONSUMER_FAILURE_LINE = `${XML_FAILURE_PREFIX}Error: consumer blew up\n`;

describe('tailFile', () => {
  describe('line reading', () => {
    it('VALID: single line appended => calls onLine with that line', async () => {
      const proxy = tailFileProxy();
      const onLine = jest.fn();
      const onError = jest.fn();

      tailFile({ path: '/tmp/test.jsonl', onLine, onError });

      proxy.setupLines({ lines: ['{"type":"message"}'] });
      proxy.triggerChange();
      await flushPromises();

      expect(onLine).toHaveBeenCalledTimes(1);
      expect(onLine).toHaveBeenNthCalledWith(1, { line: '{"type":"message"}' });
      expect(onError).toHaveBeenCalledTimes(0);
    });

    it('VALID: multiple lines appended at once => calls onLine for each line', async () => {
      const proxy = tailFileProxy();
      const onLine = jest.fn();

      tailFile({ path: '/tmp/test.jsonl', onLine, onError: () => {} });

      proxy.setupLines({ lines: ['line-one', 'line-two', 'line-three'] });
      proxy.triggerChange();
      await flushPromises();

      expect(onLine).toHaveBeenCalledTimes(3);
      expect(onLine).toHaveBeenNthCalledWith(1, { line: 'line-one' });
      expect(onLine).toHaveBeenNthCalledWith(2, { line: 'line-two' });
      expect(onLine).toHaveBeenNthCalledWith(3, { line: 'line-three' });
    });

    it('EDGE: empty lines are skipped => onLine not called for empty strings', async () => {
      const proxy = tailFileProxy();
      const onLine = jest.fn();

      tailFile({ path: '/tmp/test.jsonl', onLine, onError: () => {} });

      proxy.setupLines({ lines: ['', 'non-empty', ''] });
      proxy.triggerChange();
      await flushPromises();

      expect(onLine).toHaveBeenCalledTimes(1);
      expect(onLine).toHaveBeenNthCalledWith(1, { line: 'non-empty' });
    });
  });

  describe('concurrent read guard', () => {
    it('EDGE: second change event while reading => ignored until first read completes', async () => {
      const proxy = tailFileProxy();
      const onLine = jest.fn();

      tailFile({ path: '/tmp/test.jsonl', onLine, onError: () => {} });

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
      const proxy = tailFileProxy();
      const onLine = jest.fn();

      const handle = tailFile({ path: '/tmp/test.jsonl', onLine, onError: () => {} });
      handle.stop();

      proxy.setupLines({ lines: ['should-not-appear'] });
      proxy.triggerChange();
      await flushPromises();

      expect(onLine).toHaveBeenCalledTimes(0);
    });
  });

  describe('startPosition parameter', () => {
    it("VALID: {startPosition: 'end', existing file content} => createReadStream starts at file size so existing content is skipped", async () => {
      const proxy = tailFileProxy();
      const onLine = jest.fn();

      proxy.setupExistingFileWithContent();

      tailFile({ path: '/tmp/test.jsonl', onLine, onError: () => {}, startPosition: 'end' });

      proxy.setupLines({ lines: ['appended-after-start'] });
      proxy.triggerChange();
      await flushPromises();

      expect(proxy.lastStartPositionWasFromFileEnd()).toBe(true);
      expect(onLine).toHaveBeenCalledTimes(1);
      expect(onLine).toHaveBeenNthCalledWith(1, { line: 'appended-after-start' });
    });

    it("VALID: {startPosition: 'beginning', existing file content} => createReadStream starts at 0 so existing content is drained", async () => {
      const proxy = tailFileProxy();
      const onLine = jest.fn();

      proxy.setupExistingFileWithContent();

      tailFile({ path: '/tmp/test.jsonl', onLine, onError: () => {}, startPosition: 'beginning' });

      proxy.setupLines({ lines: ['drained-from-start'] });
      proxy.triggerChange();
      await flushPromises();

      expect(proxy.lastStartPositionWasZero()).toBe(true);
      expect(onLine).toHaveBeenCalledTimes(1);
      expect(onLine).toHaveBeenNthCalledWith(1, { line: 'drained-from-start' });
    });
  });
});

describe('tailFile: truncation reset', () => {
  it('EDGE: {file emptied below the last read position} => the next drain restarts at 0 and delivers what was appended after the truncation', async () => {
    const proxy = tailFileProxy();
    const onLine = jest.fn();
    const onError = jest.fn();

    proxy.setupExistingFileWithContent();

    tailFile({ path: '/tmp/test.jsonl', onLine, onError, startPosition: 'end' });

    proxy.setupLines({ lines: [] });
    proxy.triggerChange();
    await flushPromises();

    proxy.setupFileTruncated();
    proxy.setupLines({ lines: ['written-after-the-truncation'] });
    proxy.triggerChange();
    await flushPromises();

    expect(proxy.lastStartPositionWasZero()).toBe(true);
    expect(onLine).toHaveBeenCalledTimes(1);
    expect(onLine).toHaveBeenNthCalledWith(1, { line: 'written-after-the-truncation' });
    expect(onError).toHaveBeenCalledTimes(0);
  });

  it('EDGE: {startPosition omitted, existing file content} => defaults to 0 (beginning) and drains existing content', async () => {
    const proxy = tailFileProxy();
    const onLine = jest.fn();

    proxy.setupExistingFileWithContent();

    tailFile({ path: '/tmp/test.jsonl', onLine, onError: () => {} });

    proxy.setupLines({ lines: ['default-drain'] });
    proxy.triggerChange();
    await flushPromises();

    expect(proxy.lastStartPositionWasZero()).toBe(true);
    expect(onLine).toHaveBeenCalledTimes(1);
    expect(onLine).toHaveBeenNthCalledWith(1, { line: 'default-drain' });
  });
});

describe('tailFile: error handling', () => {
  it('ERROR: watcher emits error => calls onError', () => {
    const proxy = tailFileProxy();
    const onError = jest.fn();

    tailFile({ path: '/tmp/test.jsonl', onLine: () => {}, onError });

    const watchError = new Error('ENOENT: file removed');
    proxy.triggerWatchError({ error: watchError });

    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenNthCalledWith(1, { error: watchError });
  });

  it('ERROR: stream error during read => calls onError', async () => {
    const proxy = tailFileProxy();
    const onError = jest.fn();

    tailFile({ path: '/tmp/test.jsonl', onLine: () => {}, onError });

    const streamError = new Error('EACCES: permission denied');
    proxy.setupStreamError({ error: streamError });
    proxy.triggerChange();
    await flushPromises();

    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenNthCalledWith(1, { error: streamError });
  });

  it('ERROR: watcher error after stop => onError not called', () => {
    const proxy = tailFileProxy();
    const onError = jest.fn();

    const handle = tailFile({ path: '/tmp/test.jsonl', onLine: () => {}, onError });
    handle.stop();

    proxy.triggerWatchError({ error: new Error('should-not-appear') });

    expect(onError).toHaveBeenCalledTimes(0);
  });

  it('ERROR: statSync fails during a drain => calls onError', async () => {
    const proxy = tailFileProxy();
    const onError = jest.fn();

    tailFile({ path: '/tmp/test.jsonl', onLine: () => {}, onError });

    proxy.setupLines({ lines: ['data'] });
    proxy.setupStatError({ error: new Error('ENOENT: file deleted') });
    proxy.triggerChange();
    await flushPromises();

    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenNthCalledWith(1, { error: new Error('ENOENT: file deleted') });
  });

  it('ERROR: statSync fails during a drain after stop => onError not called', async () => {
    const proxy = tailFileProxy();
    const onError = jest.fn();

    const handle = tailFile({ path: '/tmp/test.jsonl', onLine: () => {}, onError });

    proxy.setupLines({ lines: ['data'] });
    proxy.setupStatError({ error: new Error('ENOENT: file deleted') });
    handle.stop();
    proxy.triggerChange();
    await flushPromises();

    expect(onError).toHaveBeenCalledTimes(0);
  });

  it('ERROR: {file missing at setup time} => existsSync short-circuits, onError called with ENOENT, no throw to caller', () => {
    const proxy = tailFileProxy();
    const onLine = jest.fn();
    const onError = jest.fn();

    proxy.setupFileMissing();

    const handle = tailFile({ path: '/tmp/missing.jsonl', onLine, onError });
    handle.stop();

    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenNthCalledWith(1, {
      error: new Error('ENOENT: file does not exist: /tmp/missing.jsonl'),
    });
    expect(onLine).toHaveBeenCalledTimes(0);
  });

  it('ERROR: stream error after stop => onError not called', async () => {
    const proxy = tailFileProxy();
    const onError = jest.fn();

    const handle = tailFile({ path: '/tmp/test.jsonl', onLine: () => {}, onError });

    proxy.setupStreamError({ error: new Error('EACCES') });
    handle.stop();
    proxy.triggerChange();
    await flushPromises();

    expect(onError).toHaveBeenCalledTimes(0);
  });
});

describe('tailFile: awaitCreate parameter', () => {
  it('VALID: {awaitCreate: true, file missing at construction then created} => waits, then drains content without ENOENT', async () => {
    const proxy = tailFileProxy();
    const onLine = jest.fn();
    const onError = jest.fn();

    proxy.setupFileMissingUntilCreated();

    const handle = tailFile({
      path: '/tmp/late-created.jsonl',
      onLine,
      onError,
      awaitCreate: true,
    });

    expect(onError).toHaveBeenCalledTimes(0);
    expect(onLine).toHaveBeenCalledTimes(0);

    proxy.markFileCreated();
    proxy.setupLines({ lines: ['first-real-line'] });
    proxy.triggerChange();
    proxy.triggerChange();
    await flushPromises();
    handle.stop();

    expect(onError).toHaveBeenCalledTimes(0);
    expect(onLine).toHaveBeenCalledTimes(1);
    expect(onLine).toHaveBeenNthCalledWith(1, { line: 'first-real-line' });
  });

  it('EDGE: {awaitCreate omitted, file missing} => still surfaces ENOENT', () => {
    const proxy = tailFileProxy();
    const onLine = jest.fn();
    const onError = jest.fn();

    proxy.setupFileMissing();

    const handle = tailFile({ path: '/tmp/missing-no-await.jsonl', onLine, onError });
    handle.stop();

    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenNthCalledWith(1, {
      error: new Error('ENOENT: file does not exist: /tmp/missing-no-await.jsonl'),
    });
    expect(onLine).toHaveBeenCalledTimes(0);
  });
});

describe('tailFile: a throwing onLine', () => {
  it('ERROR: onLine throws on the first line => later lines are still delivered', async () => {
    const proxy = tailFileProxy();
    const stderrSpy = registerSpyOn({ object: process.stderr, method: 'write' });
    stderrSpy.calledWith([CONSUMER_FAILURE_LINE]).returns(true);
    const onLine = jest.fn();
    onLine.mockImplementationOnce(() => {
      throw new Error('consumer blew up');
    });

    tailFile({ path: '/tmp/test.jsonl', onLine, onError: () => {} });

    proxy.setupLines({ lines: ['poison', 'survivor-one', 'survivor-two'] });
    proxy.triggerChange();
    await flushPromises();

    expect(onLine).toHaveBeenCalledTimes(3);
    expect(onLine).toHaveBeenNthCalledWith(1, { line: 'poison' });
    expect(onLine).toHaveBeenNthCalledWith(2, { line: 'survivor-one' });
    expect(onLine).toHaveBeenNthCalledWith(3, { line: 'survivor-two' });
  });

  it('ERROR: onLine throws => writes the file path and the failure to stderr', async () => {
    const proxy = tailFileProxy();
    const stderrSpy = registerSpyOn({ object: process.stderr, method: 'write' });
    stderrSpy.calledWith([CONSUMER_FAILURE_LINE]).returns(true);

    tailFile({
      path: '/tmp/test.jsonl',
      onLine: () => {
        throw new Error('consumer blew up');
      },
      onError: () => {},
    });

    proxy.setupLines({ lines: ['{"bad":"line"}'] });
    proxy.triggerChange();
    await flushPromises();

    expect(stderrSpy.callsMatching([CONSUMER_FAILURE_LINE])).toStrictEqual([
      [CONSUMER_FAILURE_LINE],
    ]);
  });

  it('ERROR: onLine throws => onError is not called, so a consumer that no-ops it does not hide the bug', async () => {
    const proxy = tailFileProxy();
    const stderrSpy = registerSpyOn({ object: process.stderr, method: 'write' });
    stderrSpy.calledWith([CONSUMER_FAILURE_LINE]).returns(true);
    const onError = jest.fn();

    tailFile({
      path: '/tmp/test.jsonl',
      onLine: () => {
        throw new Error('consumer blew up');
      },
      onError,
    });

    proxy.setupLines({ lines: ['{"bad":"line"}'] });
    proxy.triggerChange();
    await flushPromises();

    expect(onError).toHaveBeenCalledTimes(0);
  });
});
