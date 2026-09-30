import { locationsRateLimitsHistoryPathFindBroker } from './locations-rate-limits-history-path-find-broker';
import { locationsRateLimitsHistoryPathFindBrokerProxy } from './locations-rate-limits-history-path-find-broker.proxy';

describe('locationsRateLimitsHistoryPathFindBroker', () => {
  it('VALID: {homeDir: "/home/user"} => returns /home/user/.dungeonmaster/rate-limits-history.jsonl', () => {
    const proxy = locationsRateLimitsHistoryPathFindBrokerProxy();

    proxy.setupHistoryPath({
      homeDir: '/home/user',
      homePath: '/home/user/.dungeonmaster',
      historyPath: '/home/user/.dungeonmaster/rate-limits-history.jsonl',
    });

    const result = locationsRateLimitsHistoryPathFindBroker();

    expect(result).toBe(
      '/home/user/.dungeonmaster/rate-limits-history.jsonl',
    );
  });
});
