import { RateLimitsSnapshotStub } from '@dungeonmaster/shared/contracts';

import { rateLimitsWatchBroker } from './rate-limits-watch-broker';
import { rateLimitsWatchBrokerProxy } from './rate-limits-watch-broker.proxy';

describe('rateLimitsWatchBroker', () => {
  it('VALID: {tick fires, file changed} => onSnapshot called with parsed snapshot', async () => {
    const proxy = rateLimitsWatchBrokerProxy({ intervalMs: 5000 });
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

  describe('onTick', () => {
    it('VALID: {a tick where the file changed} => fires alongside onSnapshot', async () => {
      const proxy = rateLimitsWatchBrokerProxy({ intervalMs: 5000 });
      proxy.setupReadSucceeds({ contents: JSON.stringify(RateLimitsSnapshotStub()) });

      const onTick = jest.fn();
      const handle = rateLimitsWatchBroker({
        intervalMs: 5000,
        onSnapshot: () => undefined,
        onTick,
        onError: () => undefined,
      });

      proxy.triggerTick();
      await new Promise((resolve) => {
        setImmediate(resolve);
      });

      handle.stop();

      expect(onTick.mock.calls).toStrictEqual([[]]);
    });

    it('VALID: {a tick where the file is absent} => STILL fires, which is the clock that lifts a hold', async () => {
      const proxy = rateLimitsWatchBrokerProxy({ intervalMs: 5000 });
      proxy.setupReadEnoent();

      const onTick = jest.fn();
      const onSnapshot = jest.fn();
      const handle = rateLimitsWatchBroker({
        intervalMs: 5000,
        onSnapshot,
        onTick,
        onError: () => undefined,
      });

      proxy.triggerTick();
      await new Promise((resolve) => {
        setImmediate(resolve);
      });

      handle.stop();

      // No snapshot change at all, yet the tick still fired. The statusline stops rewriting that
      // file the moment the user leaves their session, so a hold waiting on onSnapshot alone would
      // never see another change to expire on.
      expect([onTick.mock.calls, onSnapshot.mock.calls]).toStrictEqual([[[]], []]);
    });

    it('VALID: {two ticks} => fires once per tick', async () => {
      const proxy = rateLimitsWatchBrokerProxy({ intervalMs: 5000 });
      proxy.setupReadEnoent();

      const onTick = jest.fn();
      const handle = rateLimitsWatchBroker({
        intervalMs: 5000,
        onSnapshot: () => undefined,
        onTick,
        onError: () => undefined,
      });

      proxy.triggerTick();
      proxy.triggerTick();
      await new Promise((resolve) => {
        setImmediate(resolve);
      });

      handle.stop();

      expect(onTick.mock.calls).toStrictEqual([[], []]);
    });

    it('EMPTY: {onTick omitted} => the poller still runs', async () => {
      const proxy = rateLimitsWatchBrokerProxy({ intervalMs: 5000 });
      proxy.setupReadSucceeds({ contents: JSON.stringify(RateLimitsSnapshotStub()) });

      const onSnapshot = jest.fn();
      const handle = rateLimitsWatchBroker({
        intervalMs: 5000,
        onSnapshot,
        onError: () => undefined,
      });

      proxy.triggerTick();
      await new Promise((resolve) => {
        setImmediate(resolve);
      });

      handle.stop();

      expect(onSnapshot).toHaveBeenCalledWith({ snapshot: RateLimitsSnapshotStub() });
    });
  });

  it('VALID: {handle.stop} => stop is a no-arg function', () => {
    rateLimitsWatchBrokerProxy({ intervalMs: 5000 });
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
