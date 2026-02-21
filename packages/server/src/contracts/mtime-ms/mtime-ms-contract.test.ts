import { mtimeMsContract } from './mtime-ms-contract';
import { MtimeMsStub } from './mtime-ms.stub';

describe('mtimeMsContract', () => {
  describe('valid inputs', () => {
    it('VALID: {value: 0} => parses zero', () => {
      const result = mtimeMsContract.parse(0);

      expect(result).toBe(0);
    });

    it('VALID: {value: 1708473600000} => parses timestamp', () => {
      const result = mtimeMsContract.parse(1708473600000);

      expect(result).toBe(1708473600000);
    });

    it('VALID: {value: 0.5} => parses fractional milliseconds', () => {
      const result = mtimeMsContract.parse(0.5);

      expect(result).toBe(0.5);
    });
  });

  describe('invalid inputs', () => {
    it('INVALID_VALUE: {value: -1} => throws for negative number', () => {
      expect(() => mtimeMsContract.parse(-1)).toThrow(/Number must be greater than or equal to 0/u);
    });

    it('INVALID_VALUE: {value: "0"} => throws for string', () => {
      expect(() => mtimeMsContract.parse('0')).toThrow(/Expected number/u);
    });

    it('EMPTY: {value: null} => throws for null', () => {
      expect(() => mtimeMsContract.parse(null)).toThrow(/Expected number/u);
    });

    it('EMPTY: {value: undefined} => throws for undefined', () => {
      expect(() => mtimeMsContract.parse(undefined)).toThrow(/Required/u);
    });
  });

  describe('stub', () => {
    it('VALID: {default} => creates valid mtime ms', () => {
      const result = MtimeMsStub();

      expect(result).toBe(1708473600000);
    });

    it('VALID: {value: 5000} => creates mtime ms with custom value', () => {
      const result = MtimeMsStub({ value: 5000 });

      expect(result).toBe(5000);
    });
  });
});
