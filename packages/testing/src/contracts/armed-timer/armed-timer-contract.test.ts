import { armedTimerContract } from './armed-timer-contract';
import { ArmedTimerStub } from './armed-timer.stub';

describe('armedTimerContract', () => {
  describe('valid armed timers', () => {
    it('VALID: {kind: setInterval, stack} => keeps both data fields', () => {
      const armed = ArmedTimerStub({
        kind: 'setInterval',
        stack: 'at pollBroker (packages/a/src/poll-broker.ts:12:3)',
      });

      expect({ kind: armed.kind, stack: armed.stack }).toStrictEqual({
        kind: 'setInterval',
        stack: 'at pollBroker (packages/a/src/poll-broker.ts:12:3)',
      });
    });

    it('VALID: {isPending: () => false} => keeps the supplied function', () => {
      const armed = ArmedTimerStub({ isPending: (): boolean => false });

      expect(armed.isPending()).toBe(false);
    });

    it('VALID: {no isPending} => defaults to pending', () => {
      const armed = ArmedTimerStub();

      expect(armed.isPending()).toBe(true);
    });

    it('VALID: {kind: setTimeout} => parses', () => {
      const armed = ArmedTimerStub({ kind: 'setTimeout' });

      expect(armed.kind).toBe('setTimeout');
    });

    it('VALID: {kind: setImmediate} => parses', () => {
      const armed = ArmedTimerStub({ kind: 'setImmediate' });

      expect(armed.kind).toBe('setImmediate');
    });
  });

  describe('invalid armed timers', () => {
    it('INVALID: {kind: "queueMicrotask"} => throws', () => {
      expect(() => armedTimerContract.parse({ kind: 'queueMicrotask', stack: '' })).toThrow(
        /Invalid enum value/u,
      );
    });

    it('EMPTY: {} => throws', () => {
      expect(() => armedTimerContract.parse({})).toThrow(/Required/u);
    });
  });
});
