import { tailFile } from './tail-file';
import { tailFileProxy } from './tail-file.proxy';
import { registerSpyOn } from '@dungeonmaster/testing/register-mock';
import { FileMissingErrorStub } from '../file-missing-error/file-missing-error.stub';
import { FsErrorStub } from '../is-fs-error/fs-error.stub';

const flushOnce = async (): Promise<void> =>
  new Promise((resolve) => {
    setImmediate(resolve);
  });

// A change that lands mid-drain re-drains once the first drain closes, which is two turns of the
// event loop.
const flushPromises = async (): Promise<void> => {
  await flushOnce();
  await flushOnce();
  await flushOnce();
};

// The failure reaches `onError` as a real error carrying the fs `code` a caller branches on.
const reportedFailure = ({
  onError,
}: {
  onError: jest.Mock;
}): { message: string; code: unknown; path: unknown } => {
  const [firstCall] = onError.mock.calls;
  const [{ error }] = firstCall;
  return { message: error.message, code: error.code, path: error.path };
};

const TEST_PATH = '/tmp/test.jsonl';
const XML_FAILURE_PREFIX = `[tail-file] onLine failed for ${TEST_PATH}: `;
const CONSUMER_FAILURE_LINE = `${XML_FAILURE_PREFIX}Error: consumer blew up\n`;

describe('tailFile', () => {
  describe('line reading', () => {
    it('VALID: single line appended => calls onLine with that line', async () => {
      const proxy = tailFileProxy();
      proxy.setupFile({ path: TEST_PATH });
      const onLine = jest.fn();
      const onError = jest.fn();

      tailFile({ path: TEST_PATH, onLine, onError });

      proxy.setupLines({ path: TEST_PATH, lines: ['{"type":"message"}'] });
      proxy.triggerChange({ path: TEST_PATH });
      await flushPromises();

      expect(onLine).toHaveBeenCalledTimes(1);
      expect(onLine).toHaveBeenNthCalledWith(1, { line: '{"type":"message"}' });
      expect(onError).toHaveBeenCalledTimes(0);
    });

    it('VALID: multiple lines appended at once => calls onLine for each line', async () => {
      const proxy = tailFileProxy();
      proxy.setupFile({ path: TEST_PATH });
      const onLine = jest.fn();

      tailFile({ path: TEST_PATH, onLine, onError: () => undefined });

      proxy.setupLines({ path: TEST_PATH, lines: ['line-one', 'line-two', 'line-three'] });
      proxy.triggerChange({ path: TEST_PATH });
      await flushPromises();

      expect(onLine).toHaveBeenCalledTimes(3);
      expect(onLine).toHaveBeenNthCalledWith(1, { line: 'line-one' });
      expect(onLine).toHaveBeenNthCalledWith(2, { line: 'line-two' });
      expect(onLine).toHaveBeenNthCalledWith(3, { line: 'line-three' });
    });

    it('EDGE: empty lines are skipped => onLine not called for empty strings', async () => {
      const proxy = tailFileProxy();
      proxy.setupFile({ path: TEST_PATH });
      const onLine = jest.fn();

      tailFile({ path: TEST_PATH, onLine, onError: () => undefined });

      proxy.setupLines({ path: TEST_PATH, lines: ['', 'non-empty', ''] });
      proxy.triggerChange({ path: TEST_PATH });
      await flushPromises();

      expect(onLine).toHaveBeenCalledTimes(1);
      expect(onLine).toHaveBeenNthCalledWith(1, { line: 'non-empty' });
    });
  });

  describe('concurrent read guard', () => {
    it('EDGE: second change event while reading => ignored until first read completes', async () => {
      const proxy = tailFileProxy();
      proxy.setupFile({ path: TEST_PATH });
      const onLine = jest.fn();

      tailFile({ path: TEST_PATH, onLine, onError: () => undefined });

      proxy.setupLines({ path: TEST_PATH, lines: ['first-batch'] });
      proxy.triggerChange({ path: TEST_PATH });
      proxy.triggerChange({ path: TEST_PATH });
      await flushPromises();

      expect(onLine).toHaveBeenCalledTimes(1);
      expect(onLine).toHaveBeenNthCalledWith(1, { line: 'first-batch' });
    });
  });

  describe('stop handle', () => {
    it('VALID: stop() called => watcher is closed and no more lines emitted', async () => {
      const proxy = tailFileProxy();
      proxy.setupFile({ path: TEST_PATH });
      const onLine = jest.fn();

      const handle = tailFile({ path: TEST_PATH, onLine, onError: () => undefined });
      handle.stop();

      proxy.setupLines({ path: TEST_PATH, lines: ['should-not-appear'] });
      proxy.triggerChange({ path: TEST_PATH });
      await flushPromises();

      expect(onLine).toHaveBeenCalledTimes(0);
    });
  });

  describe('startPosition parameter', () => {
    it("VALID: {startPosition: 'end', existing file content} => createReadStream starts at file size so existing content is skipped", async () => {
      const proxy = tailFileProxy();
      proxy.setupFile({ path: TEST_PATH });
      const onLine = jest.fn();

      proxy.setupExistingFileWithContent({ path: TEST_PATH });

      tailFile({ path: TEST_PATH, onLine, onError: () => undefined, startPosition: 'end' });

      proxy.setupLines({ path: TEST_PATH, lines: ['appended-after-start'] });
      proxy.triggerChange({ path: TEST_PATH });
      await flushPromises();

      expect(proxy.lastStartPositionWasFromFileEnd({ path: TEST_PATH })).toBe(true);
      expect(onLine).toHaveBeenCalledTimes(1);
      expect(onLine).toHaveBeenNthCalledWith(1, { line: 'appended-after-start' });
    });

    it("VALID: {startPosition: 'beginning', existing file content} => createReadStream starts at 0 so existing content is drained", async () => {
      const proxy = tailFileProxy();
      proxy.setupFile({ path: TEST_PATH });
      const onLine = jest.fn();

      proxy.setupExistingFileWithContent({ path: TEST_PATH });
      proxy.setupLines({ path: TEST_PATH, lines: ['drained-from-start'] });

      const handle = tailFile({
        path: TEST_PATH,
        onLine,
        onError: () => undefined,
        startPosition: 'beginning',
      });
      await handle.initialDrain;

      expect(proxy.lastStartPositionWasZero({ path: TEST_PATH })).toBe(true);
      expect(onLine).toHaveBeenCalledTimes(1);
      expect(onLine).toHaveBeenNthCalledWith(1, { line: 'drained-from-start' });
    });
  });
});

describe('tailFile: truncation reset', () => {
  it('EDGE: {file emptied below the last read position} => the next drain restarts at 0 and delivers what was appended after the truncation', async () => {
    const proxy = tailFileProxy();
    proxy.setupFile({ path: TEST_PATH });
    const onLine = jest.fn();
    const onError = jest.fn();

    proxy.setupExistingFileWithContent({ path: TEST_PATH });

    tailFile({ path: TEST_PATH, onLine, onError, startPosition: 'end' });

    proxy.setupLines({ path: TEST_PATH, lines: [] });
    proxy.triggerChange({ path: TEST_PATH });
    await flushPromises();

    proxy.setupFileTruncated({ path: TEST_PATH });
    proxy.setupLines({ path: TEST_PATH, lines: ['written-after-the-truncation'] });
    proxy.triggerChange({ path: TEST_PATH });
    await flushPromises();

    expect(proxy.lastStartPositionWasZero({ path: TEST_PATH })).toBe(true);
    expect(onLine).toHaveBeenCalledTimes(1);
    expect(onLine).toHaveBeenNthCalledWith(1, { line: 'written-after-the-truncation' });
    expect(onError).toHaveBeenCalledTimes(0);
  });

  it('EDGE: {startPosition omitted, existing file content} => defaults to 0 (beginning) and drains existing content', async () => {
    const proxy = tailFileProxy();
    proxy.setupFile({ path: TEST_PATH });
    const onLine = jest.fn();

    proxy.setupExistingFileWithContent({ path: TEST_PATH });
    proxy.setupLines({ path: TEST_PATH, lines: ['default-drain'] });

    const handle = tailFile({ path: TEST_PATH, onLine, onError: () => undefined });
    await handle.initialDrain;

    expect(proxy.lastStartPositionWasZero({ path: TEST_PATH })).toBe(true);
    expect(onLine).toHaveBeenCalledTimes(1);
    expect(onLine).toHaveBeenNthCalledWith(1, { line: 'default-drain' });
  });
});

describe('tailFile: error handling', () => {
  it('ERROR: watcher emits error => calls onError', async () => {
    const proxy = tailFileProxy();
    proxy.setupFile({ path: TEST_PATH });
    const onError = jest.fn();

    tailFile({ path: TEST_PATH, onLine: () => undefined, onError });

    const watchError = FileMissingErrorStub({ path: TEST_PATH });
    proxy.triggerWatchError({ path: TEST_PATH, error: watchError });

    expect(onError).toHaveBeenCalledTimes(1);

    await flushPromises();

    expect(onError).toHaveBeenNthCalledWith(1, { error: watchError });
  });

  it('ERROR: stream error during read => calls onError', async () => {
    const proxy = tailFileProxy();
    proxy.setupFile({ path: TEST_PATH });
    const onError = jest.fn();

    tailFile({ path: TEST_PATH, onLine: () => undefined, onError });

    const streamError = FsErrorStub({ code: 'EACCES', path: TEST_PATH, syscall: 'read' });
    proxy.setupStreamError({ path: TEST_PATH, error: streamError });
    proxy.triggerChange({ path: TEST_PATH });
    await flushPromises();

    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenNthCalledWith(1, { error: streamError });
  });

  it('ERROR: watcher error after stop => onError not called', async () => {
    const proxy = tailFileProxy();
    proxy.setupFile({ path: TEST_PATH });
    const onError = jest.fn();

    const handle = tailFile({ path: TEST_PATH, onLine: () => undefined, onError });
    handle.stop();

    proxy.triggerWatchError({ path: TEST_PATH, error: new Error('should-not-appear') });
    await flushPromises();

    expect(onError).toHaveBeenCalledTimes(0);
  });

  it('ERROR: statSync fails during a drain => calls onError', async () => {
    const proxy = tailFileProxy();
    proxy.setupFile({ path: TEST_PATH });
    const onError = jest.fn();

    tailFile({ path: TEST_PATH, onLine: () => undefined, onError });

    proxy.setupLines({ path: TEST_PATH, lines: ['data'] });
    const statError = FileMissingErrorStub({ path: TEST_PATH });
    proxy.setupStatError({ path: TEST_PATH, error: statError });
    proxy.triggerChange({ path: TEST_PATH });
    await flushPromises();

    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenNthCalledWith(1, { error: statError });
  });

  it('ERROR: statSync fails during a drain after stop => onError not called', async () => {
    const proxy = tailFileProxy();
    proxy.setupFile({ path: TEST_PATH });
    const onError = jest.fn();

    const handle = tailFile({ path: TEST_PATH, onLine: () => undefined, onError });

    proxy.setupLines({ path: TEST_PATH, lines: ['data'] });
    const statError = FileMissingErrorStub({ path: TEST_PATH });
    proxy.setupStatError({ path: TEST_PATH, error: statError });
    handle.stop();
    proxy.triggerChange({ path: TEST_PATH });
    await flushPromises();

    expect(onError).toHaveBeenCalledTimes(0);
  });

  it('ERROR: {file missing at setup time} => existsSync short-circuits, onError called with ENOENT, no throw to caller', () => {
    const proxy = tailFileProxy();
    const onLine = jest.fn();
    const onError = jest.fn();

    proxy.setupFileMissing({ path: '/tmp/missing.jsonl' });

    const handle = tailFile({ path: '/tmp/missing.jsonl', onLine, onError });
    handle.stop();

    expect(onError).toHaveBeenCalledTimes(1);

    const missing = FileMissingErrorStub({ path: '/tmp/missing.jsonl' });

    expect(reportedFailure({ onError })).toStrictEqual({
      message: 'ENOENT: file does not exist: /tmp/missing.jsonl',
      code: missing.code,
      path: missing.path,
    });
    expect(onLine).toHaveBeenCalledTimes(0);
  });

  it('ERROR: stream error after stop => onError not called', async () => {
    const proxy = tailFileProxy();
    proxy.setupFile({ path: TEST_PATH });
    const onError = jest.fn();

    const handle = tailFile({ path: TEST_PATH, onLine: () => undefined, onError });

    proxy.setupStreamError({
      path: TEST_PATH,
      error: FsErrorStub({ code: 'EACCES', path: TEST_PATH, syscall: 'read' }),
    });
    handle.stop();
    proxy.triggerChange({ path: TEST_PATH });
    await flushPromises();

    expect(onError).toHaveBeenCalledTimes(0);
  });
});

describe('tailFile: awaitCreate parameter', () => {
  it('VALID: {awaitCreate: true, file missing at construction then created} => waits, then drains content without ENOENT', async () => {
    const proxy = tailFileProxy();
    const onLine = jest.fn();
    const onError = jest.fn();

    proxy.setupFileMissingUntilCreated({ path: '/tmp/late-created.jsonl' });

    const handle = tailFile({
      path: '/tmp/late-created.jsonl',
      onLine,
      onError,
      awaitCreate: true,
    });

    expect(onError).toHaveBeenCalledTimes(0);
    expect(onLine).toHaveBeenCalledTimes(0);

    proxy.markFileCreated({ path: '/tmp/late-created.jsonl' });
    proxy.setupLines({ path: '/tmp/late-created.jsonl', lines: ['first-real-line'] });
    proxy.triggerChange({ path: '/tmp/late-created.jsonl' });
    proxy.triggerChange({ path: '/tmp/late-created.jsonl' });
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

    proxy.setupFileMissing({ path: '/tmp/missing-no-await.jsonl' });

    const handle = tailFile({ path: '/tmp/missing-no-await.jsonl', onLine, onError });
    handle.stop();

    expect(onError).toHaveBeenCalledTimes(1);

    const missing = FileMissingErrorStub({ path: '/tmp/missing-no-await.jsonl' });

    expect(reportedFailure({ onError })).toStrictEqual({
      message: 'ENOENT: file does not exist: /tmp/missing-no-await.jsonl',
      code: missing.code,
      path: missing.path,
    });
    expect(onLine).toHaveBeenCalledTimes(0);
  });
});

describe('tailFile: initialDrain', () => {
  it('VALID: {file with existing content, startPosition omitted} => initialDrain resolves only after the existing lines were delivered', async () => {
    const proxy = tailFileProxy();
    const onLine = jest.fn();
    const settled: string[] = [];

    proxy.setupExistingFileWithContent({ path: TEST_PATH });
    proxy.setupLines({ path: TEST_PATH, lines: ['existing-one', 'existing-two'] });

    const handle = tailFile({ path: TEST_PATH, onLine, onError: () => undefined });
    const drained = handle.initialDrain.then(() => {
      settled.push(`drained-after-${String(onLine.mock.calls.length)}-lines`);
    });

    expect(onLine).toHaveBeenCalledTimes(0);

    await drained;
    handle.stop();

    expect(settled).toStrictEqual(['drained-after-2-lines']);
    expect(onLine).toHaveBeenNthCalledWith(1, { line: 'existing-one' });
    expect(onLine).toHaveBeenNthCalledWith(2, { line: 'existing-two' });
  });

  it("VALID: {startPosition: 'end'} => initialDrain resolves with nothing delivered", async () => {
    const proxy = tailFileProxy();
    const onLine = jest.fn();

    proxy.setupExistingFileWithContent({ path: TEST_PATH });
    proxy.setupLines({ path: TEST_PATH, lines: [] });

    const handle = tailFile({
      path: TEST_PATH,
      onLine,
      onError: () => undefined,
      startPosition: 'end',
    });

    await expect(handle.initialDrain).resolves.toBe(undefined);

    handle.stop();

    expect(onLine).toHaveBeenCalledTimes(0);
    expect(proxy.lastStartPositionWasFromFileEnd({ path: TEST_PATH })).toBe(true);
  });

  it('ERROR: {file missing, awaitCreate omitted} => initialDrain resolves after ENOENT is reported', async () => {
    const proxy = tailFileProxy();
    const onError = jest.fn();

    proxy.setupFileMissing({ path: '/tmp/missing-drain.jsonl' });

    const handle = tailFile({ path: '/tmp/missing-drain.jsonl', onLine: jest.fn(), onError });

    await expect(handle.initialDrain).resolves.toBe(undefined);

    const missing = FileMissingErrorStub({ path: '/tmp/missing-drain.jsonl' });

    expect(reportedFailure({ onError })).toStrictEqual({
      message: 'ENOENT: file does not exist: /tmp/missing-drain.jsonl',
      code: missing.code,
      path: missing.path,
    });
  });

  it('ERROR: {stream error during the first drain} => initialDrain still resolves', async () => {
    const proxy = tailFileProxy();
    const onError = jest.fn();
    const streamError = FsErrorStub({ code: 'EACCES', path: TEST_PATH, syscall: 'read' });

    proxy.setupStreamError({ path: TEST_PATH, error: streamError });

    const handle = tailFile({ path: TEST_PATH, onLine: jest.fn(), onError });

    await expect(handle.initialDrain).resolves.toBe(undefined);

    handle.stop();

    expect(onError).toHaveBeenNthCalledWith(1, { error: streamError });
  });

  it('VALID: {awaitCreate, file appears later with content} => initialDrain resolves after the delegated tail delivered the content', async () => {
    const proxy = tailFileProxy();
    const onLine = jest.fn();

    proxy.setupFileMissingUntilCreated({ path: '/tmp/late-drain.jsonl' });
    proxy.setupLines({ path: '/tmp/late-drain.jsonl', lines: ['created-line'] });

    const handle = tailFile({
      path: '/tmp/late-drain.jsonl',
      onLine,
      onError: () => undefined,
      awaitCreate: true,
    });

    proxy.markFileCreated({ path: '/tmp/late-drain.jsonl' });
    proxy.triggerChange({ path: '/tmp/late-drain.jsonl' });
    await handle.initialDrain;
    handle.stop();

    expect(onLine).toHaveBeenCalledTimes(1);
    expect(onLine).toHaveBeenNthCalledWith(1, { line: 'created-line' });
  });

  it('EDGE: {awaitCreate, file never appears, stop() called} => initialDrain resolves so an awaiter never hangs', async () => {
    const proxy = tailFileProxy();

    proxy.setupFileMissingUntilCreated({ path: '/tmp/never-drain.jsonl' });

    const handle = tailFile({
      path: '/tmp/never-drain.jsonl',
      onLine: jest.fn(),
      onError: () => undefined,
      awaitCreate: true,
    });
    handle.stop();

    await expect(handle.initialDrain).resolves.toBe(undefined);
  });
});

describe('tailFile: initialDrain teardown and one-shot staging', () => {
  it('EDGE: {first drain never closes, stop() called} => initialDrain resolves so an awaiter never hangs', async () => {
    const proxy = tailFileProxy();

    proxy.setupNextDrainNeverCloses({ path: TEST_PATH });

    const handle = tailFile({ path: TEST_PATH, onLine: jest.fn(), onError: jest.fn() });
    handle.stop();

    await expect(handle.initialDrain).resolves.toBe(undefined);
  });

  it('VALID: {setupFileMissing once} => the first tail reports ENOENT and the next tail of the same path finds the file', async () => {
    const proxy = tailFileProxy();
    const firstError = jest.fn();
    const secondError = jest.fn();
    const onLine = jest.fn();

    proxy.setupFileMissing({ path: TEST_PATH });
    proxy.setupLines({ path: TEST_PATH, lines: ['now-present'] });

    const first = tailFile({ path: TEST_PATH, onLine: jest.fn(), onError: firstError });
    const second = tailFile({ path: TEST_PATH, onLine, onError: secondError });
    await Promise.all([first.initialDrain, second.initialDrain]);
    second.stop();

    expect(firstError).toHaveBeenCalledTimes(1);
    expect(secondError).toHaveBeenCalledTimes(0);
    expect(onLine.mock.calls).toStrictEqual([[{ line: 'now-present' }]]);
  });
});

describe('tailFile: path addressing', () => {
  it('VALID: {two files tailed at once} => each file gets only its own lines and its own watcher', async () => {
    const proxy = tailFileProxy();
    const firstLines = jest.fn();
    const secondLines = jest.fn();

    proxy.setupLines({ path: '/tmp/first.jsonl', lines: ['from-first'] });
    proxy.setupLines({ path: '/tmp/second.jsonl', lines: ['from-second'] });

    const first = tailFile({ path: '/tmp/first.jsonl', onLine: firstLines, onError: jest.fn() });
    const second = tailFile({ path: '/tmp/second.jsonl', onLine: secondLines, onError: jest.fn() });
    await Promise.all([first.initialDrain, second.initialDrain]);
    first.stop();
    second.stop();

    expect(firstLines.mock.calls).toStrictEqual([[{ line: 'from-first' }]]);
    expect(secondLines.mock.calls).toStrictEqual([[{ line: 'from-second' }]]);
    expect(
      proxy.getWatchCallsFor({ path: '/tmp/first.jsonl' }).map((call) => call[0]),
    ).toStrictEqual(['/tmp/first.jsonl']);
    expect(
      proxy.getWatchCallsFor({ path: '/tmp/second.jsonl' }).map((call) => call[0]),
    ).toStrictEqual(['/tmp/second.jsonl']);
  });

  it('ERROR: {a path nobody staged} => the call throws instead of reading as a phantom file', () => {
    tailFileProxy();

    expect(() =>
      tailFile({ path: '/tmp/never-staged.jsonl', onLine: jest.fn(), onError: jest.fn() }),
    ).toThrow(/never-staged\.jsonl/u);
  });
});

describe('tailFile: a throwing onLine', () => {
  it('ERROR: onLine throws on the first line => later lines are still delivered', async () => {
    const proxy = tailFileProxy();
    proxy.setupFile({ path: TEST_PATH });
    const stderrSpy = registerSpyOn({ object: process.stderr, method: 'write' });
    stderrSpy.calledWith([CONSUMER_FAILURE_LINE]).returns(true);
    const onLine = jest.fn();
    onLine.mockImplementationOnce(() => {
      throw new Error('consumer blew up');
    });

    tailFile({ path: TEST_PATH, onLine, onError: () => undefined });

    proxy.setupLines({ path: TEST_PATH, lines: ['poison', 'survivor-one', 'survivor-two'] });
    proxy.triggerChange({ path: TEST_PATH });
    await flushPromises();

    expect(onLine).toHaveBeenCalledTimes(3);
    expect(onLine).toHaveBeenNthCalledWith(1, { line: 'poison' });
    expect(onLine).toHaveBeenNthCalledWith(2, { line: 'survivor-one' });
    expect(onLine).toHaveBeenNthCalledWith(3, { line: 'survivor-two' });
  });

  it('ERROR: onLine throws => writes the file path and the failure to stderr', async () => {
    const proxy = tailFileProxy();
    proxy.setupFile({ path: TEST_PATH });
    const stderrSpy = registerSpyOn({ object: process.stderr, method: 'write' });
    stderrSpy.calledWith([CONSUMER_FAILURE_LINE]).returns(true);

    tailFile({
      path: TEST_PATH,
      onLine: () => {
        throw new Error('consumer blew up');
      },
      onError: () => undefined,
    });

    proxy.setupLines({ path: TEST_PATH, lines: ['{"bad":"line"}'] });
    proxy.triggerChange({ path: TEST_PATH });
    await flushPromises();

    expect(stderrSpy.callsMatching([CONSUMER_FAILURE_LINE])).toStrictEqual([
      [CONSUMER_FAILURE_LINE],
    ]);
  });

  it('ERROR: onLine throws => onError is not called, so a consumer that no-ops it does not hide the bug', async () => {
    const proxy = tailFileProxy();
    proxy.setupFile({ path: TEST_PATH });
    const stderrSpy = registerSpyOn({ object: process.stderr, method: 'write' });
    stderrSpy.calledWith([CONSUMER_FAILURE_LINE]).returns(true);
    const onError = jest.fn();

    tailFile({
      path: TEST_PATH,
      onLine: () => {
        throw new Error('consumer blew up');
      },
      onError,
    });

    proxy.setupLines({ path: TEST_PATH, lines: ['{"bad":"line"}'] });
    proxy.triggerChange({ path: TEST_PATH });
    await flushPromises();

    expect(onError).toHaveBeenCalledTimes(0);
  });
});
