import { timerSetTimeoutAdapter } from './timer-set-timeout-adapter';
import { timerSetTimeoutAdapterProxy } from './timer-set-timeout-adapter.proxy';
import { TimeoutMsStub } from '../../../contracts/timeout-ms/timeout-ms.stub';

describe('timerSetTimeoutAdapter', () => {
  describe('valid timeout creation', () => {
    it('VALID: {callback, delayMs: 1000} => returns timer ID and does not call callback immediately', () => {
      const proxy = timerSetTimeoutAdapterProxy();
      const expectedTimerId = proxy.setupNeverFire();

      const callback = jest.fn();

      const timerId = timerSetTimeoutAdapter({
        callback,
        delayMs: TimeoutMsStub({ value: 1000 }),
      });

      expect(timerId).toStrictEqual(expectedTimerId);
      expect(callback).toHaveBeenCalledTimes(0);
    });

    it('VALID: {callback, delayMs: 0} => returns timer ID and executes callback via setImmediate', async () => {
      const proxy = timerSetTimeoutAdapterProxy();
      const expectedTimerId = proxy.setupImmediate();

      const callback = jest.fn();

      const timerId = timerSetTimeoutAdapter({
        callback,
        delayMs: TimeoutMsStub({ value: 0 }),
      });

      expect(timerId).toStrictEqual(expectedTimerId);

      await new Promise<void>((resolve) => {
        setImmediate(() => {
          resolve();
        });
      });

      expect(callback).toHaveBeenCalledTimes(1);
    });
  });
});
