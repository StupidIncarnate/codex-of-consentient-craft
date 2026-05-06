import { RateLimitsSnapshotStub } from '@dungeonmaster/shared/contracts';

import { rateLimitsSnapshotWriteBroker } from './rate-limits-snapshot-write-broker';
import { rateLimitsSnapshotWriteBrokerProxy } from './rate-limits-snapshot-write-broker.proxy';

describe('rateLimitsSnapshotWriteBroker', () => {
  it('VALID: {fresh file} => writes snapshot via tmp+rename', async () => {
    const proxy = rateLimitsSnapshotWriteBrokerProxy();
    proxy.setupAcceptedWrite();

    const result = await rateLimitsSnapshotWriteBroker({
      snapshot: RateLimitsSnapshotStub(),
      nowMs: 10_000_000,
    });

    expect(result).toStrictEqual({ written: true });
    expect(proxy.getWriteCalls()).toStrictEqual([
      {
        path: '/home/test/.dungeonmaster/rate-limits.json.tmp',
        content: `${JSON.stringify(RateLimitsSnapshotStub())}\n`,
      },
    ]);
    expect(proxy.getRenameCalls()).toStrictEqual([
      {
        from: '/home/test/.dungeonmaster/rate-limits.json.tmp',
        to: '/home/test/.dungeonmaster/rate-limits.json',
      },
    ]);
  });

  it('EDGE: {file mtime 100ms ago} => skips write within 5s throttle', async () => {
    const proxy = rateLimitsSnapshotWriteBrokerProxy();
    proxy.setupThrottledWrite({ mtimeMs: 9_999_900 });

    const result = await rateLimitsSnapshotWriteBroker({
      snapshot: RateLimitsSnapshotStub(),
      nowMs: 10_000_000,
    });

    expect(result).toStrictEqual({ written: false });
    expect(proxy.getWriteCalls()).toStrictEqual([]);
    expect(proxy.getRenameCalls()).toStrictEqual([]);
  });

  it('VALID: {file mtime 6s ago} => writes after 5s throttle expires', async () => {
    const proxy = rateLimitsSnapshotWriteBrokerProxy();
    proxy.setupThrottledWrite({ mtimeMs: 9_994_000 });

    const result = await rateLimitsSnapshotWriteBroker({
      snapshot: RateLimitsSnapshotStub(),
      nowMs: 10_000_000,
    });

    expect(result).toStrictEqual({ written: true });
    expect(proxy.getWriteCalls()).toStrictEqual([
      {
        path: '/home/test/.dungeonmaster/rate-limits.json.tmp',
        content: `${JSON.stringify(RateLimitsSnapshotStub())}\n`,
      },
    ]);
  });

  it('EDGE: {file mtime exactly 5s ago} => writes (boundary inclusive)', async () => {
    const proxy = rateLimitsSnapshotWriteBrokerProxy();
    proxy.setupThrottledWrite({ mtimeMs: 9_995_000 });

    const result = await rateLimitsSnapshotWriteBroker({
      snapshot: RateLimitsSnapshotStub(),
      nowMs: 10_000_000,
    });

    expect(result).toStrictEqual({ written: true });
  });
});
