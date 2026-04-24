import { QuestIdStub, SmoketestSuiteStub, UrlSlugStub } from '@dungeonmaster/shared/contracts';

import { toolingRunSmoketestBroker } from './tooling-run-smoketest-broker';
import { toolingRunSmoketestBrokerProxy } from './tooling-run-smoketest-broker.proxy';

describe('toolingRunSmoketestBroker', () => {
  it('VALID: {suite: mcp} => returns enqueued entries parsed through contracts', async () => {
    const questId = QuestIdStub({ value: '11111111-2222-3333-4444-555555555555' });
    const guildSlug = UrlSlugStub({ value: 'my-guild' });
    const proxy = toolingRunSmoketestBrokerProxy();
    proxy.setupSuccess({ enqueued: [{ questId, guildSlug }] });

    const result = await toolingRunSmoketestBroker({
      suite: SmoketestSuiteStub({ value: 'mcp' }),
    });

    expect(result).toStrictEqual({ enqueued: [{ questId, guildSlug }] });
  });

  it('EMPTY: {suite: mcp, server returns no enqueued} => returns empty enqueued array', async () => {
    const proxy = toolingRunSmoketestBrokerProxy();
    proxy.setupSuccess({ enqueued: [] });

    const result = await toolingRunSmoketestBroker({
      suite: SmoketestSuiteStub({ value: 'mcp' }),
    });

    expect(result).toStrictEqual({ enqueued: [] });
  });
});
