import { isTimerHoldingLoopGuard } from './is-timer-holding-loop-guard';
import { TimeoutStub } from '#gateway/node/setTimeout/timeout/timeout.stub';
import { setInterval } from '#gateway/node/setInterval';
import { clearInterval } from '#gateway/node/clearInterval';

describe('isTimerHoldingLoopGuard', () => {
  describe('handles that hold the loop', () => {
    it('VALID: {handle: a real timeout, never unref-ed} => returns true', () => {
      const handle = TimeoutStub();

      const result = isTimerHoldingLoopGuard({ handle });

      expect(result).toBe(true);
    });

    it('VALID: {handle: a plain number, as jsdom returns} => returns true', () => {
      const result = isTimerHoldingLoopGuard({ handle: 7 });

      expect(result).toBe(true);
    });
  });

  describe('handles that hold nothing', () => {
    it('VALID: {handle: a real timeout that was unref-ed} => returns false', () => {
      const handle = TimeoutStub({ unref: true });

      const result = isTimerHoldingLoopGuard({ handle });

      expect(result).toBe(false);
    });
  });

  describe('empty inputs', () => {
    it('EMPTY: {handle: undefined} => returns false', () => {
      const result = isTimerHoldingLoopGuard({});

      expect(result).toBe(false);
    });
  });

  describe('a real node timer', () => {
    it('VALID: {live interval} => returns true, and false once unref-ed', () => {
      const interval = setInterval(() => undefined, 60_000);

      const whileRefed = isTimerHoldingLoopGuard({ handle: interval });
      interval.unref();
      const afterUnref = isTimerHoldingLoopGuard({ handle: interval });
      clearInterval(interval);

      expect([whileRefed, afterUnref]).toStrictEqual([true, false]);
    });
  });
});
