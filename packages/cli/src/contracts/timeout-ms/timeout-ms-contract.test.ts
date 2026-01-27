import { timeoutMsContract } from './timeout-ms-contract';
import { TimeoutMsStub } from './timeout-ms.stub';

describe('timeoutMsContract', () => {
  describe('valid inputs', () => {
    it('VALID: {value: 0} => parses zero timeout', () => {
      const result = timeoutMsContract.parse(0);

      expect(result).toBe(0);
    });

    it('VALID: {value: 60000} => parses 60 second timeout', () => {
      const result = timeoutMsContract.parse(60000);

      expect(result).toBe(60000);
    });

    it('VALID: {value: 300000} => parses 5 minute timeout', () => {
      const result = timeoutMsContract.parse(300000);

      expect(result).toBe(300000);
    });
  });

  describe('invalid inputs', () => {
    it('INVALID_VALUE: {value: -1} => throws for negative number', () => {
      expect(() => timeoutMsContract.parse(-1)).toThrow(
        /Number must be greater than or equal to 0/u,
      );
    });

    it('INVALID_VALUE: {value: 1.5} => throws for non-integer', () => {
      expect(() => timeoutMsContract.parse(1.5)).toThrow(/Expected integer/u);
    });

    it('INVALID_VALUE: {value: "60000"} => throws for string', () => {
      expect(() => timeoutMsContract.parse('60000')).toThrow(/Expected number/u);
    });

    it('INVALID_VALUE: {value: null} => throws for null', () => {
      expect(() => timeoutMsContract.parse(null)).toThrow(/Expected number/u);
    });

    it('INVALID_VALUE: {value: undefined} => throws for undefined', () => {
      expect(() => timeoutMsContract.parse(undefined)).toThrow(/Required/u);
    });
  });

  describe('stub', () => {
    it('VALID: {default} => creates valid timeout with default value 60000', () => {
      const result = TimeoutMsStub();

      expect(result).toBe(60000);
    });

    it('VALID: {value: 30000} => creates timeout with custom value', () => {
      const result = TimeoutMsStub({ value: 30000 });

      expect(result).toBe(30000);
    });
  });
});
