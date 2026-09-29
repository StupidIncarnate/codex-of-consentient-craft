import { setTimeout } from '../../setTimeout/setTimeout';
import { clearTimeout } from './clear-timeout';
import { clearTimeoutProxy } from './clear-timeout.proxy';

describe('clearTimeout', () => {
  it('VALID: {armed timer} => cancels it before it fires', async () => {
    let fired = false;
    const handle = setTimeout(() => {
      fired = true;
    }, 10);

    clearTimeout(handle);

    await new Promise((resolve) => {
      setTimeout(resolve, 20);
    });

    expect(fired).toBe(false);
  });

  it('VALID: {handle cleared twice} => the second clear is a no-op and the timer stays cancelled', async () => {
    let fired = false;
    const handle = setTimeout(() => {
      fired = true;
    }, 10);

    clearTimeout(handle);
    clearTimeout(handle);

    await new Promise((resolve) => {
      setTimeout(resolve, 20);
    });

    expect(fired).toBe(false);
  });

  describe('getCallsFor', () => {
    it('VALID: {two timers, one cleared} => reads back the clear for that handle only', () => {
      const proxy = clearTimeoutProxy();
      const cleared = setTimeout(() => undefined, 100);
      const kept = setTimeout(() => undefined, 100);

      clearTimeout(cleared);
      clearTimeout(kept);
      clearTimeout(kept);

      expect({
        cleared: proxy.getCallsFor({ handle: cleared }),
        kept: proxy.getCallsFor({ handle: kept }),
      }).toStrictEqual({ cleared: [[cleared]], kept: [[kept], [kept]] });
    });
  });
});
