import { registerSpyOn } from '@dungeonmaster/testing/register-mock';

import { CliStatuslineTapResponder } from './cli-statusline-tap-responder';
import { CliStatuslineTapResponderProxy } from './cli-statusline-tap-responder.proxy';

describe('CliStatuslineTapResponder', () => {
  it('VALID: {stdin: full payload} => writes snapshot, appends history, passes through stdout', async () => {
    const stdoutSpy = registerSpyOn({ object: process.stdout, method: 'write' });
    stdoutSpy.mockReturnValue(true);
    const dateSpy = registerSpyOn({ object: Date, method: 'now' });
    dateSpy.mockReturnValue(1746450000000);

    const proxy = CliStatuslineTapResponderProxy();
    const stdin = JSON.stringify({
      rate_limits: {
        five_hour: { used_percentage: 42, resets_at: '2026-05-05T15:00:00.000Z' },
        seven_day: { used_percentage: 20, resets_at: '2026-05-05T15:00:00.000Z' },
      },
    });
    proxy.setupStdin({ data: stdin });
    proxy.setupAcceptedWrite();

    const result = await CliStatuslineTapResponder();
    proxy.restoreStdin();

    expect(result).toStrictEqual({ success: true });
    expect(stdoutSpy.mock.calls[0]?.[0]).toBe(stdin);
    expect(stdoutSpy.mock.calls.map((c) => c[0])).toStrictEqual([stdin]);
    expect(proxy.getSnapshotWriteCalls().map((c) => c.path)).toStrictEqual([
      '/home/test/.dungeonmaster/rate-limits.json.tmp',
    ]);
    expect(proxy.getHistoryAppendCalls().map((c) => c.path)).toStrictEqual([
      '/home/test/.dungeonmaster/rate-limits-history.jsonl',
    ]);
  });

  it('EDGE: {throttled} => passes through stdout but does NOT append history', async () => {
    const stdoutSpy = registerSpyOn({ object: process.stdout, method: 'write' });
    stdoutSpy.mockReturnValue(true);
    const dateSpy = registerSpyOn({ object: Date, method: 'now' });
    dateSpy.mockReturnValue(1746450000000);

    const proxy = CliStatuslineTapResponderProxy();
    const stdin = JSON.stringify({
      rate_limits: {
        five_hour: { used_percentage: 42, resets_at: '2026-05-05T15:00:00.000Z' },
      },
    });
    proxy.setupStdin({ data: stdin });
    proxy.setupThrottledWrite({ mtimeMs: 1746449999000 });

    const result = await CliStatuslineTapResponder();
    proxy.restoreStdin();

    expect(result).toStrictEqual({ success: true });
    expect(stdoutSpy.mock.calls[0]?.[0]).toBe(stdin);
    expect(proxy.getHistoryAppendCalls()).toStrictEqual([]);
  });

  it('ERROR: {malformed JSON} => still passes through stdout, does NOT write file, exits success', async () => {
    const stdoutSpy = registerSpyOn({ object: process.stdout, method: 'write' });
    stdoutSpy.mockReturnValue(true);
    const stderrSpy = registerSpyOn({ object: process.stderr, method: 'write' });
    stderrSpy.mockReturnValue(true);

    const proxy = CliStatuslineTapResponderProxy();
    proxy.setupStdin({ data: 'not json' });
    proxy.setupAcceptedWrite();

    const result = await CliStatuslineTapResponder();
    proxy.restoreStdin();

    expect(result).toStrictEqual({ success: true });
    expect(stdoutSpy.mock.calls[0]?.[0]).toBe('not json');
    expect(proxy.getSnapshotWriteCalls()).toStrictEqual([]);
  });

  it('EMPTY: {stdin: ""} => passes through empty string, does NOT write', async () => {
    const stdoutSpy = registerSpyOn({ object: process.stdout, method: 'write' });
    stdoutSpy.mockReturnValue(true);
    const stderrSpy = registerSpyOn({ object: process.stderr, method: 'write' });
    stderrSpy.mockReturnValue(true);

    const proxy = CliStatuslineTapResponderProxy();
    proxy.setupStdin({ data: '' });
    proxy.setupAcceptedWrite();

    const result = await CliStatuslineTapResponder();
    proxy.restoreStdin();

    expect(result).toStrictEqual({ success: true });
    expect(stdoutSpy.mock.calls[0]?.[0]).toBe('');
    expect(proxy.getSnapshotWriteCalls()).toStrictEqual([]);
  });
});
