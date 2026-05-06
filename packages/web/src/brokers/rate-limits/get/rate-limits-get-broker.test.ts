import { RateLimitsSnapshotStub } from '@dungeonmaster/shared/contracts';

import { rateLimitsGetBroker } from './rate-limits-get-broker';
import { rateLimitsGetBrokerProxy } from './rate-limits-get-broker.proxy';

describe('rateLimitsGetBroker', () => {
  it('VALID: {server returns snapshot} => returns parsed snapshot', async () => {
    const proxy = rateLimitsGetBrokerProxy();
    const snapshot = RateLimitsSnapshotStub();
    proxy.setupSnapshot({ snapshot });

    const result = await rateLimitsGetBroker();

    expect(result).toStrictEqual(snapshot);
  });

  it('EMPTY: {server returns null} => returns null', async () => {
    const proxy = rateLimitsGetBrokerProxy();
    proxy.setupSnapshot({ snapshot: null });

    const result = await rateLimitsGetBroker();

    expect(result).toBe(null);
  });

  it('ERROR: {network error} => rejects with fetch failure', async () => {
    const proxy = rateLimitsGetBrokerProxy();
    proxy.setupError();

    await expect(rateLimitsGetBroker()).rejects.toThrow(/.+/u);
  });
});
