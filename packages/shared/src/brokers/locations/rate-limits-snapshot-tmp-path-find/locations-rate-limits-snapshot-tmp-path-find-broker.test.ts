import { locationsRateLimitsSnapshotTmpPathFindBroker } from './locations-rate-limits-snapshot-tmp-path-find-broker';
import { locationsRateLimitsSnapshotTmpPathFindBrokerProxy } from './locations-rate-limits-snapshot-tmp-path-find-broker.proxy';

describe('locationsRateLimitsSnapshotTmpPathFindBroker', () => {
  it('VALID: {homeDir: "/home/user"} => returns /home/user/.dungeonmaster/rate-limits.json.tmp', () => {
    const proxy = locationsRateLimitsSnapshotTmpPathFindBrokerProxy();

    proxy.setupTmpPath({
      homeDir: '/home/user',
      homePath: '/home/user/.dungeonmaster',
      tmpPath: '/home/user/.dungeonmaster/rate-limits.json.tmp',
    });

    const result = locationsRateLimitsSnapshotTmpPathFindBroker();

    expect(result).toBe(
      '/home/user/.dungeonmaster/rate-limits.json.tmp',
    );
  });
});
