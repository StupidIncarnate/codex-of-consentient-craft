import { timersWatchAdapter } from './timers-watch-adapter';
import { timersWatchAdapterProxy } from './timers-watch-adapter.proxy';
import type { ArmedTimerStub } from '../../../contracts/armed-timer/armed-timer.stub';

type ArmedTimer = ReturnType<typeof ArmedTimerStub>;

describe('timersWatchAdapter', () => {
  describe('return value', () => {
    it('VALID: {onArm} => returns success', () => {
      timersWatchAdapterProxy();
      const armed: ArmedTimer[] = [];

      const result = timersWatchAdapter({ onArm: ({ armed: entry }) => armed.push(entry) });

      expect(result).toStrictEqual({ success: true });
    });
  });

  describe('timers that are still holding the loop', () => {
    it('VALID: {un-cleared setInterval} => reports kind setInterval, still pending', () => {
      timersWatchAdapterProxy();
      const armed: ArmedTimer[] = [];
      timersWatchAdapter({ onArm: ({ armed: entry }) => armed.push(entry) });

      const interval = setInterval(() => undefined, 60_000);
      const reported = armed.map((entry) => [entry.kind, entry.isPending()]);
      clearInterval(interval);

      expect(reported).toStrictEqual([['setInterval', true]]);
    });

    it('VALID: {un-fired setTimeout} => reports kind setTimeout, still pending', () => {
      timersWatchAdapterProxy();
      const armed: ArmedTimer[] = [];
      timersWatchAdapter({ onArm: ({ armed: entry }) => armed.push(entry) });

      const timeout = setTimeout(() => undefined, 60_000);
      const reported = armed.map((entry) => [entry.kind, entry.isPending()]);
      clearTimeout(timeout);

      expect(reported).toStrictEqual([['setTimeout', true]]);
    });
  });

  describe('timers that are holding nothing', () => {
    it('VALID: {cleared setInterval} => reported, and no longer pending', () => {
      timersWatchAdapterProxy();
      const armed: ArmedTimer[] = [];
      timersWatchAdapter({ onArm: ({ armed: entry }) => armed.push(entry) });

      clearInterval(setInterval(() => undefined, 60_000));

      expect(armed.map((entry) => entry.isPending())).toStrictEqual([false]);
    });

    it('VALID: {setTimeout that fires} => reported, and no longer pending', async () => {
      timersWatchAdapterProxy();
      const armed: ArmedTimer[] = [];
      timersWatchAdapter({ onArm: ({ armed: entry }) => armed.push(entry) });

      await new Promise((resolve) => {
        setTimeout(resolve, 1);
      });

      expect(armed.map((entry) => entry.isPending())).toStrictEqual([false]);
    });

    it('VALID: {setImmediate that fires} => reported, and no longer pending', async () => {
      timersWatchAdapterProxy();
      const armed: ArmedTimer[] = [];
      timersWatchAdapter({ onArm: ({ armed: entry }) => armed.push(entry) });

      await new Promise((resolve) => {
        setImmediate(resolve);
      });

      expect(armed.map((entry) => [entry.kind, entry.isPending()])).toStrictEqual([
        ['setImmediate', false],
      ]);
    });

    it('VALID: {unref-ed setInterval} => reported, and not pending', () => {
      timersWatchAdapterProxy();
      const armed: ArmedTimer[] = [];
      timersWatchAdapter({ onArm: ({ armed: entry }) => armed.push(entry) });

      const interval = setInterval(() => undefined, 60_000);
      interval.unref();
      const reported = armed.map((entry) => entry.isPending());
      clearInterval(interval);

      expect(reported).toStrictEqual([false]);
    });
  });

  describe('the stack it captures', () => {
    it('VALID: {setInterval armed here} => first frame names this test file', () => {
      timersWatchAdapterProxy();
      const armed: ArmedTimer[] = [];
      timersWatchAdapter({ onArm: ({ armed: entry }) => armed.push(entry) });

      const interval = setInterval(() => undefined, 60_000);
      const namesThisFile = armed
        .flatMap((entry) => entry.stack.split('\n').slice(0, 1))
        .map((frame) => /timers-watch-adapter\.test\.ts:\d+:\d+\)$/u.test(frame));
      clearInterval(interval);

      expect(namesThisFile).toStrictEqual([true]);
    });
  });

  describe('a second call', () => {
    it('VALID: {second onArm} => the second listener reports, the first does not', () => {
      timersWatchAdapterProxy();
      const first: ArmedTimer[] = [];
      const second: ArmedTimer[] = [];
      timersWatchAdapter({ onArm: ({ armed: entry }) => first.push(entry) });
      timersWatchAdapter({ onArm: ({ armed: entry }) => second.push(entry) });

      const interval = setInterval(() => undefined, 60_000);
      const counts = [first.length, second.length];
      clearInterval(interval);

      expect(counts).toStrictEqual([0, 1]);
    });
  });
});
