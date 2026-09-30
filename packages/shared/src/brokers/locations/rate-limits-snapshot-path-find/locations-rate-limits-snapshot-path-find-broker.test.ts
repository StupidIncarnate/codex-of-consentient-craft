import { locationsRateLimitsSnapshotPathFindBroker } from './locations-rate-limits-snapshot-path-find-broker';
import { locationsRateLimitsSnapshotPathFindBrokerProxy } from './locations-rate-limits-snapshot-path-find-broker.proxy';

describe('locationsRateLimitsSnapshotPathFindBroker', () => {
  it('VALID: {homeDir: "/home/user"} => returns /home/user/.dungeonmaster/rate-limits.json', () => {
    const proxy = locationsRateLimitsSnapshotPathFindBrokerProxy();

    proxy.setupSnapshotPath({
      homeDir: '/home/user',
      homePath: '/home/user/.dungeonmaster',
      snapshotPath: '/home/user/.dungeonmaster/rate-limits.json',
    });

    const result = locationsRateLimitsSnapshotPathFindBroker();

    expect(result).toBe(
      '/home/user/.dungeonmaster/rate-limits.json',
    );
  });
});
