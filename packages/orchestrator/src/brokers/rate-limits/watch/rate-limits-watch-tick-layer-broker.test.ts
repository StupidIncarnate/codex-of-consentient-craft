import { FileContentsStub, RateLimitsSnapshotStub } from '@dungeonmaster/shared/contracts';

import { rateLimitsWatchTickLayerBroker } from './rate-limits-watch-tick-layer-broker';
import { rateLimitsWatchTickLayerBrokerProxy } from './rate-limits-watch-tick-layer-broker.proxy';

describe('rateLimitsWatchTickLayerBroker', () => {
  it('VALID: {first valid read} => fires onSnapshot, returns "changed" with new lastJson', async () => {
    const proxy = rateLimitsWatchTickLayerBrokerProxy();
    const json = JSON.stringify(RateLimitsSnapshotStub());
    proxy.setupReadSucceeds({ contents: json });

    const onSnapshot = jest.fn();
    const onError = jest.fn();

    const result = await rateLimitsWatchTickLayerBroker({
      lastJson: null,
      onSnapshot,
      onError,
    });

    expect(result).toStrictEqual({ outcome: 'changed', lastJson: json });
    expect(onSnapshot).toHaveBeenCalledWith({ snapshot: RateLimitsSnapshotStub() });
    expect(onError.mock.calls).toStrictEqual([]);
  });

  it('EDGE: {repeat read with same content} => no fire, returns "unchanged"', async () => {
    const proxy = rateLimitsWatchTickLayerBrokerProxy();
    const json = JSON.stringify(RateLimitsSnapshotStub());
    proxy.setupReadSucceeds({ contents: json });

    const onSnapshot = jest.fn();
    const onError = jest.fn();

    const result = await rateLimitsWatchTickLayerBroker({
      lastJson: FileContentsStub({ value: json }),
      onSnapshot,
      onError,
    });

    expect(result).toStrictEqual({ outcome: 'unchanged', lastJson: json });
    expect(onSnapshot.mock.calls).toStrictEqual([]);
  });

  it('EDGE: {ENOENT after prior read} => fires onSnapshot(null), returns "cleared"', async () => {
    const proxy = rateLimitsWatchTickLayerBrokerProxy();
    proxy.setupReadEnoent();

    const onSnapshot = jest.fn();
    const onError = jest.fn();

    const result = await rateLimitsWatchTickLayerBroker({
      lastJson: FileContentsStub({ value: '{"old":1}' }),
      onSnapshot,
      onError,
    });

    expect(result).toStrictEqual({ outcome: 'cleared', lastJson: null });
    expect(onSnapshot).toHaveBeenCalledWith({ snapshot: null });
  });

  it('EDGE: {ENOENT with no prior} => no fire, returns "unchanged"', async () => {
    const proxy = rateLimitsWatchTickLayerBrokerProxy();
    proxy.setupReadEnoent();

    const onSnapshot = jest.fn();
    const onError = jest.fn();

    const result = await rateLimitsWatchTickLayerBroker({
      lastJson: null,
      onSnapshot,
      onError,
    });

    expect(result).toStrictEqual({ outcome: 'unchanged', lastJson: null });
    expect(onSnapshot.mock.calls).toStrictEqual([]);
  });

  it('ERROR: {invalid JSON} => fires onError, returns "error" with parsed lastJson advanced', async () => {
    const proxy = rateLimitsWatchTickLayerBrokerProxy();
    proxy.setupReadSucceeds({ contents: 'not json' });

    const onSnapshot = jest.fn();
    const onError = jest.fn();

    const result = await rateLimitsWatchTickLayerBroker({
      lastJson: null,
      onSnapshot,
      onError,
    });

    expect(result).toStrictEqual({ outcome: 'error', lastJson: 'not json' });
    expect(onSnapshot.mock.calls).toStrictEqual([]);
    expect(onError).toHaveBeenCalledTimes(1);
  });

  it('ERROR: {non-ENOENT read failure} => fires onError, returns "error", lastJson unchanged', async () => {
    const proxy = rateLimitsWatchTickLayerBrokerProxy();
    proxy.setupReadError({ error: new Error('EACCES') });

    const onSnapshot = jest.fn();
    const onError = jest.fn();

    const prior = FileContentsStub({ value: '{"prior":1}' });
    const result = await rateLimitsWatchTickLayerBroker({
      lastJson: prior,
      onSnapshot,
      onError,
    });

    expect(result).toStrictEqual({ outcome: 'error', lastJson: prior });
    expect(onError).toHaveBeenCalledTimes(1);
  });
});
