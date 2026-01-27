import { timerClearTimeoutAdapter } from './timer-clear-timeout-adapter';
import { timerClearTimeoutAdapterProxy } from './timer-clear-timeout-adapter.proxy';
import { TimerIdStub } from '../../../contracts/timer-id/timer-id.stub';

describe('timerClearTimeoutAdapter', () => {
  describe('valid timeout cancellation', () => {
    it('VALID: {timerId} => clears the timeout', () => {
      const proxy = timerClearTimeoutAdapterProxy();
      const timerId = TimerIdStub({ value: 12345 });

      timerClearTimeoutAdapter({ timerId });

      expect(proxy.getClearedTimerId()).toBe(12345);
    });
  });
});
