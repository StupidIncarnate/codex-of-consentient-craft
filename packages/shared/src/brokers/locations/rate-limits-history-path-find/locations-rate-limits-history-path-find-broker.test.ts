import { locationsRateLimitsHistoryPathFindBroker } from './locations-rate-limits-history-path-find-broker';
import { locationsRateLimitsHistoryPathFindBrokerProxy } from './locations-rate-limits-history-path-find-broker.proxy';
import { FilePathStub } from '../../../contracts/file-path/file-path.stub';
import { AbsoluteFilePathStub } from '../../../contracts/absolute-file-path/absolute-file-path.stub';

describe('locationsRateLimitsHistoryPathFindBroker', () => {
  it('VALID: {homeDir: "/home/user"} => returns /home/user/.dungeonmaster/rate-limits-history.jsonl', () => {
    const proxy = locationsRateLimitsHistoryPathFindBrokerProxy();

    proxy.setupHistoryPath({
      homeDir: '/home/user',
      homePath: FilePathStub({ value: '/home/user/.dungeonmaster' }),
      historyPath: FilePathStub({
        value: '/home/user/.dungeonmaster/rate-limits-history.jsonl',
      }),
    });

    const result = locationsRateLimitsHistoryPathFindBroker();

    expect(result).toBe(
      AbsoluteFilePathStub({ value: '/home/user/.dungeonmaster/rate-limits-history.jsonl' }),
    );
  });
});
