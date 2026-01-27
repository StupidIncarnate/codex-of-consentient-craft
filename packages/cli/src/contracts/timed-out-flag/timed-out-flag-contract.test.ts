import { timedOutFlagContract } from './timed-out-flag-contract';
import { TimedOutFlagStub } from './timed-out-flag.stub';

describe('timedOutFlagContract', () => {
  describe('valid inputs', () => {
    it('VALID: {value: true} => parses to branded true', () => {
      const result = timedOutFlagContract.parse(true);

      expect(result).toBe(true);
    });

    it('VALID: {value: false} => parses to branded false', () => {
      const result = timedOutFlagContract.parse(false);

      expect(result).toBe(false);
    });
  });

  describe('invalid inputs', () => {
    it('INVALID_VALUE: {value: "true"} => throws for string', () => {
      expect(() => timedOutFlagContract.parse('true')).toThrow(/Expected boolean/u);
    });

    it('INVALID_VALUE: {value: 1} => throws for number', () => {
      expect(() => timedOutFlagContract.parse(1)).toThrow(/Expected boolean/u);
    });

    it('INVALID_VALUE: {value: null} => throws for null', () => {
      expect(() => timedOutFlagContract.parse(null)).toThrow(/Expected boolean/u);
    });

    it('INVALID_VALUE: {value: undefined} => throws for undefined', () => {
      expect(() => timedOutFlagContract.parse(undefined)).toThrow(/Required/u);
    });
  });

  describe('stub', () => {
    it('VALID: {default} => creates timed out flag with default value false', () => {
      const result = TimedOutFlagStub();

      expect(result).toBe(false);
    });

    it('VALID: {value: true} => creates timed out flag with custom value', () => {
      const result = TimedOutFlagStub({ value: true });

      expect(result).toBe(true);
    });

    it('VALID: {value: false} => creates timed out flag with explicit false', () => {
      const result = TimedOutFlagStub({ value: false });

      expect(result).toBe(false);
    });
  });
});
