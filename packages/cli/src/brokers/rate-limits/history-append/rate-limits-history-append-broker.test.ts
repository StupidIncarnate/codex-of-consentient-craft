import { RateLimitsHistoryLineStub } from '@dungeonmaster/shared/contracts';

import { rateLimitsHistoryAppendBroker } from './rate-limits-history-append-broker';
import { rateLimitsHistoryAppendBrokerProxy } from './rate-limits-history-append-broker.proxy';

describe('rateLimitsHistoryAppendBroker', () => {
  it('VALID: {line} => appends serialized JSONL line', async () => {
    const proxy = rateLimitsHistoryAppendBrokerProxy();
    proxy.setupAcceptedAppend();

    const result = await rateLimitsHistoryAppendBroker({
      line: RateLimitsHistoryLineStub(),
    });

    expect(result).toStrictEqual({ appended: true });
    expect(proxy.getAppendCalls()).toStrictEqual([
      {
        path: '/home/test/.dungeonmaster/rate-limits-history.jsonl',
        content: `${JSON.stringify(RateLimitsHistoryLineStub())}\n`,
      },
    ]);
  });
});
