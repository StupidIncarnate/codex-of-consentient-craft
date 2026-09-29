import { CliStatuslineTapResponder } from './cli-statusline-tap-responder';
import { CliStatuslineTapResponderProxy } from './cli-statusline-tap-responder.proxy';

describe('CliStatuslineTapResponder', () => {
  it('VALID: {stdin: full payload} => writes snapshot, appends history, passes through stdout', async () => {
    const stdin = JSON.stringify({
      rate_limits: {
        five_hour: { used_percentage: 42, resets_at: '2026-05-05T15:00:00.000Z' },
        seven_day: { used_percentage: 20, resets_at: '2026-05-05T15:00:00.000Z' },
      },
    });
    const proxy = CliStatuslineTapResponderProxy();
    proxy.setupNow({ nowMs: 1746450000000 });
    proxy.setupStdin({ data: stdin });
    proxy.setupAcceptedWrite();

    await expect(CliStatuslineTapResponder()).resolves.toBe(undefined);

    proxy.restoreStdin();

    expect(proxy.getStdoutWrites()).toStrictEqual([stdin]);
    expect(proxy.getStderrWrites()).toStrictEqual([]);
    expect(proxy.getSnapshotWriteCalls().map((c) => c.path)).toStrictEqual([
      '/home/test/.dungeonmaster/rate-limits.json.tmp',
    ]);
    expect(proxy.getHistoryAppendCalls().map((c) => c.path)).toStrictEqual([
      '/home/test/.dungeonmaster/rate-limits-history.jsonl',
    ]);
  });

  it('EDGE: {throttled} => passes through stdout but does NOT append history', async () => {
    const stdin = JSON.stringify({
      rate_limits: {
        five_hour: { used_percentage: 42, resets_at: '2026-05-05T15:00:00.000Z' },
      },
    });
    const proxy = CliStatuslineTapResponderProxy();
    proxy.setupNow({ nowMs: 1746450000000 });
    proxy.setupStdin({ data: stdin });
    proxy.setupThrottledWrite({ mtimeMs: 1746449999000 });

    await expect(CliStatuslineTapResponder()).resolves.toBe(undefined);

    proxy.restoreStdin();

    expect(proxy.getStdoutWrites()).toStrictEqual([stdin]);
    expect(proxy.getHistoryAppendCalls()).toStrictEqual([]);
  });

  it('ERROR: {malformed JSON} => still passes through stdout, does NOT write file, exits success', async () => {
    const stdin = 'not json';
    const proxy = CliStatuslineTapResponderProxy();
    proxy.setupStdin({ data: stdin });
    proxy.setupAcceptedWrite();

    await expect(CliStatuslineTapResponder()).resolves.toBe(undefined);

    proxy.restoreStdin();

    expect(proxy.getStdoutWrites()).toStrictEqual([stdin]);
    expect(proxy.getSnapshotWriteCalls()).toStrictEqual([]);
  });

  it('EMPTY: {stdin: ""} => passes through empty string, does NOT write', async () => {
    const stdin = '';
    const proxy = CliStatuslineTapResponderProxy();
    proxy.setupStdin({ data: stdin });
    proxy.setupAcceptedWrite();

    await expect(CliStatuslineTapResponder()).resolves.toBe(undefined);

    proxy.restoreStdin();

    expect(proxy.getStdoutWrites()).toStrictEqual([stdin]);
    expect(proxy.getSnapshotWriteCalls()).toStrictEqual([]);
  });
});
