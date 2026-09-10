import { timerHandleContract } from './timer-handle-contract';
import { TimerHandleStub } from './timer-handle.stub';

describe('timerHandleContract', () => {
  describe('valid handles', () => {
    it('VALID: {hasRef: () => true} => keeps the supplied function', () => {
      const handle = TimerHandleStub({ hasRef: (): boolean => true });

      expect(handle.hasRef?.()).toBe(true);
    });

    it('VALID: {no hasRef} => defaults to a function answering true', () => {
      const handle = TimerHandleStub();

      expect(handle.hasRef?.()).toBe(true);
    });

    it('VALID: {hasRef: () => false} => keeps that answer', () => {
      const handle = TimerHandleStub({ hasRef: (): boolean => false });

      expect(handle.hasRef?.()).toBe(false);
    });
  });

  describe('what the contract itself validates', () => {
    it('EMPTY: {} => parses, because the handle carries no required data', () => {
      const result = timerHandleContract.parse({});

      expect(result).toStrictEqual({});
    });

    it('VALID: {a real node Timeout} => parses', () => {
      const interval = setInterval(() => undefined, 60_000);

      const result = timerHandleContract.parse(interval);
      clearInterval(interval);

      expect(result).toStrictEqual({});
    });

    it('INVALID: {null} => throws', () => {
      expect(() => timerHandleContract.parse(null)).toThrow(/Expected object/u);
    });
  });
});
