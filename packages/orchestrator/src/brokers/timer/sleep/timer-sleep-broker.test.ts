import { timerSleepBroker } from './timer-sleep-broker';
import { timerSleepBrokerProxy } from './timer-sleep-broker.proxy';

describe('timerSleepBroker', () => {
  describe('resolution', () => {
    it('VALID: {ms: 200} => resolves with nothing once the timer fires', async () => {
      const proxy = timerSleepBrokerProxy();
      proxy.setupResolvesImmediately({ ms: 200 });

      await expect(timerSleepBroker({ ms: 200 })).resolves.toBe(undefined);
    });

    it('VALID: {ms: 200} then {ms: 750} => registers each requested delay in order', async () => {
      const proxy = timerSleepBrokerProxy();
      proxy.setupResolvesImmediately({ ms: 200 });
      proxy.setupResolvesImmediately({ ms: 750 });

      await timerSleepBroker({ ms: 200 });
      await timerSleepBroker({ ms: 750 });

      expect(proxy.getRegisteredDelays()).toStrictEqual([200, 750]);
    });
  });
});
