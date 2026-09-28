import { timerIntervalStartBroker } from './timer-interval-start-broker';
import { timerIntervalStartBrokerProxy } from './timer-interval-start-broker.proxy';

const INTERVAL_MS = 5000;

describe('timerIntervalStartBroker', () => {
  describe('registration', () => {
    it('VALID: {callback, intervalMs} => registers the callback under that interval and runs it on every tick', () => {
      const proxy = timerIntervalStartBrokerProxy({ intervalMs: INTERVAL_MS });
      const callback = jest.fn();

      timerIntervalStartBroker({ callback, intervalMs: INTERVAL_MS });

      expect(proxy.getRegisteredCallback()).toBe(callback);

      proxy.triggerTick();
      proxy.triggerTick();

      expect(callback).toHaveBeenCalledTimes(2);
      expect(callback).toHaveBeenNthCalledWith(1);
      expect(callback).toHaveBeenNthCalledWith(2);
    });
  });

  describe('stop', () => {
    it('VALID: {stop called} => clears the interval it started', () => {
      const proxy = timerIntervalStartBrokerProxy({ intervalMs: INTERVAL_MS });

      const handle = timerIntervalStartBroker({
        callback: jest.fn(),
        intervalMs: INTERVAL_MS,
      });

      expect(proxy.wasStopped()).toBe(false);

      handle.stop();

      expect(proxy.wasStopped()).toBe(true);
    });
  });
});
