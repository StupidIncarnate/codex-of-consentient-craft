import { timerIdContract } from './timer-id-contract';
import { TimerIdStub } from './timer-id.stub';

describe('timerIdContract', () => {
  describe('valid timer IDs', () => {
    it('VALID: {value: number} => parses numeric timer ID', () => {
      const result = timerIdContract.parse(12345);

      expect(result).toBe(12345);
    });

    it('VALID: {value: real setTimeout} => parses actual timer ID', () => {
      const realTimerId = setTimeout(jest.fn(), 0);
      clearTimeout(realTimerId);

      const result = timerIdContract.parse(realTimerId);

      expect(result).toBe(realTimerId);
    });
  });

  describe('stub', () => {
    it('VALID: {default} => returns default timer ID', () => {
      const timerId = TimerIdStub();

      expect(timerId).toBe(12345);
    });

    it('VALID: {value: custom} => returns custom timer ID', () => {
      const timerId = TimerIdStub({ value: 99999 });

      expect(timerId).toBe(99999);
    });
  });

  describe('accepts any value (z.unknown)', () => {
    it('VALID: {value: string} => parses string as timer ID', () => {
      const result = timerIdContract.parse('timer-string');

      expect(result).toBe('timer-string');
    });

    it('VALID: {value: null} => parses null as timer ID', () => {
      const result = timerIdContract.parse(null);

      expect(result).toBeNull();
    });

    it('VALID: {value: undefined} => parses undefined as timer ID', () => {
      const result = timerIdContract.parse(undefined);

      expect(result).toBeUndefined();
    });
  });
});
