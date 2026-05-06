import { RateLimitsSnapshotStub } from '@dungeonmaster/shared/contracts';

import { RateLimitsGetResponderProxy } from './rate-limits-get-responder.proxy';

describe('RateLimitsGetResponder', () => {
  it('VALID: {snapshot present} => returns 200 with snapshot', async () => {
    const proxy = RateLimitsGetResponderProxy();
    const snapshot = RateLimitsSnapshotStub();
    proxy.setupSnapshot({ snapshot });

    const result = await proxy.callResponder();

    expect(result).toStrictEqual({
      status: 200,
      data: { snapshot },
    });
  });

  it('EMPTY: {no snapshot} => returns 200 with null snapshot', async () => {
    const proxy = RateLimitsGetResponderProxy();
    proxy.setupSnapshot({ snapshot: null });

    const result = await proxy.callResponder();

    expect(result).toStrictEqual({
      status: 200,
      data: { snapshot: null },
    });
  });

  it('ERROR: {adapter throws} => returns 500 with error message', async () => {
    const proxy = RateLimitsGetResponderProxy();
    proxy.setupError({ message: 'kaboom' });

    const result = await proxy.callResponder();

    expect(result).toStrictEqual({
      status: 500,
      data: { error: 'kaboom' },
    });
  });
});
