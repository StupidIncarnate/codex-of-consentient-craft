import { RateLimitsSnapshotStub } from '@dungeonmaster/shared/contracts';

import { rateLimitsWatchBroker } from './rate-limits-watch-broker';
import { rateLimitsWatchBrokerProxy } from './rate-limits-watch-broker.proxy';

describe('rateLimitsWatchBroker', () => {
  it('VALID: {tick fires, file changed} => onSnapshot called with parsed snapshot', async () => {
    const proxy = rateLimitsWatchBrokerProxy();
    const json = JSON.stringify(RateLimitsSnapshotStub());
    proxy.setupReadSucceeds({ contents: json });

    const onSnapshot = jest.fn();
    const onError = jest.fn();

    const handle = rateLimitsWatchBroker({ intervalMs: 5000, onSnapshot, onError });

    proxy.triggerTick();
    await new Promise((resolve) => {
      setImmediate(resolve);
    });

    handle.stop();

    expect(onError.mock.calls).toStrictEqual([]);
    expect(onSnapshot).toHaveBeenCalledWith({ snapshot: RateLimitsSnapshotStub() });
  });

  it('VALID: {handle.stop} => stop is a no-arg function', () => {
    rateLimitsWatchBrokerProxy();
    const onError = jest.fn();

    const handle = rateLimitsWatchBroker({
      intervalMs: 5000,
      onSnapshot: () => undefined,
      onError,
    });

    handle.stop();

    expect(onError.mock.calls).toStrictEqual([]);
  });
});
