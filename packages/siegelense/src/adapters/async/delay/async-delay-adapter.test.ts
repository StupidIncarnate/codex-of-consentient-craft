import { asyncDelayAdapter } from './async-delay-adapter';
import { asyncDelayAdapterProxy } from './async-delay-adapter.proxy';

describe('asyncDelayAdapter', () => {
  it('VALID: {ms: 1500} => resolves with success: true and passes ms to setTimeout', async () => {
    const proxy = asyncDelayAdapterProxy();

    const result = await asyncDelayAdapter({ ms: 1500 });

    expect(result).toStrictEqual({ success: true });
    expect(proxy.getRequestedDelay()).toBe(1500);
  });
});
