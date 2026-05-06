import { locationsRateLimitsSnapshotPathFindBroker } from './locations-rate-limits-snapshot-path-find-broker';
import { locationsRateLimitsSnapshotPathFindBrokerProxy } from './locations-rate-limits-snapshot-path-find-broker.proxy';
import { FilePathStub } from '../../../contracts/file-path/file-path.stub';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';

describe('locationsRateLimitsSnapshotPathFindBroker', () => {
  it('VALID: {homeDir: "/home/user"} => returns /home/user/.dungeonmaster/rate-limits.json', () => {
    const proxy = locationsRateLimitsSnapshotPathFindBrokerProxy();

    proxy.setupSnapshotPath({
      homeDir: '/home/user',
      homePath: FilePathStub({ value: '/home/user/.dungeonmaster' }),
      snapshotPath: FilePathStub({ value: '/home/user/.dungeonmaster/rate-limits.json' }),
    });

    const result = locationsRateLimitsSnapshotPathFindBroker();

    expect(result).toBe(
      AbsoluteFilePathStub({ value: '/home/user/.dungeonmaster/rate-limits.json' }),
    );
  });
});
