import { checkStatusContract } from './check-status-contract';
import { CheckStatusStub } from './check-status.stub';

describe('checkStatusContract', () => {
  describe('valid inputs', () => {
    it('VALID: {value: "pass"} => parses pass', () => {
      const result = checkStatusContract.parse('pass');

      expect(result).toBe('pass');
    });

    it('VALID: {value: "fail"} => parses fail', () => {
      const result = checkStatusContract.parse('fail');

      expect(result).toBe('fail');
    });

    it('VALID: {value: "skip"} => parses skip', () => {
      const result = checkStatusContract.parse('skip');

      expect(result).toBe('skip');
    });
  });

  describe('invalid inputs', () => {
    it('INVALID_VALUE: {value: "error"} => throws for unknown status', () => {
      expect(() => checkStatusContract.parse('error')).toThrow(/Invalid enum value/u);
    });

    it('INVALID_VALUE: {value: ""} => throws for empty string', () => {
      expect(() => checkStatusContract.parse('')).toThrow(/Invalid enum value/u);
    });

    it('EMPTY: {value: null} => throws for null', () => {
      expect(() => checkStatusContract.parse(null)).toThrow(/received null/u);
    });

    it('EMPTY: {value: undefined} => throws for undefined', () => {
      expect(() => checkStatusContract.parse(undefined)).toThrow(/Required/u);
    });
  });

  describe('stub', () => {
    it('VALID: {default} => creates valid check status', () => {
      const result = CheckStatusStub();

      expect(result).toBe('pass');
    });

    it('VALID: {value: "fail"} => creates check status with custom value', () => {
      const result = CheckStatusStub({ value: 'fail' });

      expect(result).toBe('fail');
    });
  });
});
