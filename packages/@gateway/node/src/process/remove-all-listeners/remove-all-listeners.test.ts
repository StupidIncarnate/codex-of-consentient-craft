import { removeAllListeners } from './remove-all-listeners';
import { removeAllListenersProxy } from './remove-all-listeners.proxy';

describe('removeAllListeners', () => {
  it('VALID: {event: one with two handlers} => that event ends with no handlers', () => {
    const proxy = removeAllListenersProxy();
    process.on('dm-gateway-remove-a', () => undefined);
    process.on('dm-gateway-remove-a', () => undefined);
    const before = proxy.listenerCount({ event: 'dm-gateway-remove-a' });

    removeAllListeners('dm-gateway-remove-a');

    const after = proxy.listenerCount({ event: 'dm-gateway-remove-a' });
    proxy.restoreListeners();

    expect({ before, after }).toStrictEqual({ before: 2, after: 0 });
  });

  it('VALID: {event: one of two events with handlers} => the other event keeps its handler', () => {
    const proxy = removeAllListenersProxy();
    process.on('dm-gateway-remove-a', () => undefined);
    process.on('dm-gateway-remove-b', () => undefined);

    removeAllListeners('dm-gateway-remove-a');

    const kept = proxy.listenerCount({ event: 'dm-gateway-remove-b' });
    proxy.restoreListeners();

    expect(kept).toBe(1);
  });

  it('VALID: {event: a symbol} => removes that symbol event own handlers', () => {
    const proxy = removeAllListenersProxy();
    const event = Symbol('dm-gateway-remove-symbol');
    process.on(event, () => undefined);

    removeAllListeners(event);

    const after = proxy.listenerCount({ event });
    proxy.restoreListeners();

    expect(after).toBe(0);
  });

  it('EMPTY: {no event} => every event ends with no handlers', () => {
    const proxy = removeAllListenersProxy();
    process.on('dm-gateway-remove-a', () => undefined);

    removeAllListeners();

    const remaining = proxy.eventNames();
    proxy.restoreListeners();

    expect(remaining).toStrictEqual([]);
  });

  describe('restoreListeners', () => {
    it('VALID: {restore after a clear-all} => the handlers present when the proxy was built are back and the added one is gone', () => {
      const proxy = removeAllListenersProxy();
      const namesBefore = proxy.eventNames();
      process.on('dm-gateway-remove-a', () => undefined);
      removeAllListeners();

      proxy.restoreListeners();

      expect(proxy.eventNames()).toStrictEqual(namesBefore);
    });
  });
});
