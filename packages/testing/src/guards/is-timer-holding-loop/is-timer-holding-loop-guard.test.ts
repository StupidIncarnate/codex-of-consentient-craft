import { isTimerHoldingLoopGuard } from './is-timer-holding-loop-guard';
import { TimerHandleStub } from '../../contracts/timer-handle/timer-handle.stub';
import { setInterval } from '#gateway/node/setInterval';
import { clearInterval } from '#gateway/node/clearInterval';

describe('isTimerHoldingLoopGuard', () => {
  describe('handles that hold the loop', () => {
    it('VALID: {handle: hasRef returns true} => returns true', () => {
      const handle = TimerHandleStub({ hasRef: (): boolean => true });

      const result = isTimerHoldingLoopGuard({ handle });

      expect(result).toBe(true);
    });

    it('VALID: {handle without hasRef} => returns true', () => {
      // Destructuring `hasRef` back OFF the stub's own always-present default is what produces a
      // handle genuinely missing the key — `exactOptionalPropertyTypes` refuses
      // `TimerHandleStub({ hasRef: undefined })` (an explicit `undefined` is not an absent key), and
      // this is the real jsdom shape the contract's own header names: no method at all.
      const { hasRef: _hasRef, ...handle } = TimerHandleStub({ hasRef: (): boolean => true });

      const result = isTimerHoldingLoopGuard({ handle });

      expect(result).toBe(true);
    });
  });

  describe('handles that hold nothing', () => {
    it('VALID: {handle: hasRef returns false} => returns false', () => {
      const handle = TimerHandleStub({ hasRef: (): boolean => false });

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
