import { RateLimitsWatchHandleStub } from '../../contracts/rate-limits-watch-handle/rate-limits-watch-handle.stub';
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
    const handle = RateLimitsWatchHandleStub();

    rateLimitsBootstrapState.setHandle({ handle });

    expect(rateLimitsBootstrapState.getHandle()).toBe(handle);
  });

  it('VALID: {clear} => stops handle and returns null', () => {
    const proxy = rateLimitsBootstrapStateProxy();
    proxy.reset();
    const stop = jest.fn();
    const handle = RateLimitsWatchHandleStub({ stop });
    rateLimitsBootstrapState.setHandle({ handle });

    rateLimitsBootstrapState.clear();

    expect(stop).toHaveBeenCalledTimes(1);
    expect(rateLimitsBootstrapState.getHandle()).toBe(null);
  });
});
