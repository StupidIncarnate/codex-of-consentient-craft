import { rateLimitsBootstrapState } from './rate-limits-bootstrap-state';
import { rateLimitsBootstrapStateProxy } from './rate-limits-bootstrap-state.proxy';

describe('rateLimitsBootstrapState', () => {
  it('EMPTY: {fresh} => getHandle returns null', () => {
    const proxy = rateLimitsBootstrapStateProxy();
    proxy.reset();

    expect(rateLimitsBootstrapState.getHandle()).toBe(null);
  });

  it('VALID: {set then get} => returns the handle', () => {
    const proxy = rateLimitsBootstrapStateProxy();
    proxy.reset();
    const stop = jest.fn();

    rateLimitsBootstrapState.setHandle({ handle: { stop } });

    expect(rateLimitsBootstrapState.getHandle()?.stop).toBe(stop);
  });

  it('VALID: {clear} => stops handle and returns null', () => {
    const proxy = rateLimitsBootstrapStateProxy();
    proxy.reset();
    const stop = jest.fn();
    rateLimitsBootstrapState.setHandle({ handle: { stop } });

    rateLimitsBootstrapState.clear();

    expect(stop).toHaveBeenCalledTimes(1);
    expect(rateLimitsBootstrapState.getHandle()).toBe(null);
  });
});
