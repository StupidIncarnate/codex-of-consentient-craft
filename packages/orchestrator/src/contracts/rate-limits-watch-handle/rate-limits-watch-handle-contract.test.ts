import { rateLimitsWatchHandleContract } from './rate-limits-watch-handle-contract';
import { RateLimitsWatchHandleStub } from './rate-limits-watch-handle.stub';

describe('rateLimitsWatchHandleContract', () => {
  it('VALID: stub default => parses and stop is callable', () => {
    const stop = jest.fn();
    const handle = RateLimitsWatchHandleStub({ stop });
    const parsed = rateLimitsWatchHandleContract.parse(handle);
    parsed.stop();

    expect(stop).toHaveBeenCalledTimes(1);
  });

  it('VALID: {stop function} => parses with custom stop', () => {
    const stop = jest.fn();

    const handle = RateLimitsWatchHandleStub({ stop });
    handle.stop();

    expect(stop).toHaveBeenCalledTimes(1);
  });
});
