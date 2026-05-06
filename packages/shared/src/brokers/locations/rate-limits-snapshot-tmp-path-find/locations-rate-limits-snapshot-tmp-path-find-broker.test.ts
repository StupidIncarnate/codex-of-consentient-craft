import { locationsRateLimitsSnapshotTmpPathFindBroker } from './locations-rate-limits-snapshot-tmp-path-find-broker';
import { locationsRateLimitsSnapshotTmpPathFindBrokerProxy } from './locations-rate-limits-snapshot-tmp-path-find-broker.proxy';
import { FilePathStub } from '../../../contracts/file-path/file-path.stub';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';

describe('locationsRateLimitsSnapshotTmpPathFindBroker', () => {
  it('VALID: {homeDir: "/home/user"} => returns /home/user/.dungeonmaster/rate-limits.json.tmp', () => {
    const proxy = locationsRateLimitsSnapshotTmpPathFindBrokerProxy();

    proxy.setupTmpPath({
      homeDir: '/home/user',
      homePath: FilePathStub({ value: '/home/user/.dungeonmaster' }),
      tmpPath: FilePathStub({ value: '/home/user/.dungeonmaster/rate-limits.json.tmp' }),
    });

    const result = locationsRateLimitsSnapshotTmpPathFindBroker();

    expect(result).toBe(
      AbsoluteFilePathStub({ value: '/home/user/.dungeonmaster/rate-limits.json.tmp' }),
    );
  });
});
