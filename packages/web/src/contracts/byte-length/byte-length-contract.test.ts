import { byteLengthContract } from './byte-length-contract';
import { ByteLengthStub } from './byte-length.stub';

describe('byteLengthContract', () => {
  describe('valid inputs', () => {
    it('VALID: {value: 1024} => parses positive integer', () => {
      const result = byteLengthContract.parse(1024);

      expect(result).toBe(1024);
    });

    it('EDGE: {value: 0} => parses a zero-byte read', () => {
      const result = byteLengthContract.parse(0);

      expect(result).toBe(0);
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {value: -1} => throws for negative number', () => {
      expect(() => byteLengthContract.parse(-1)).toThrow(
        /Number must be greater than or equal to 0/u,
      );
    });

    it('INVALID: {value: 1.5} => throws for non-integer', () => {
      expect(() => byteLengthContract.parse(1.5)).toThrow(/Expected integer/u);
    });

    it('INVALID: {value: "1024"} => throws for string', () => {
      expect(() => byteLengthContract.parse('1024')).toThrow(/Expected number/u);
    });
  });

  describe('stub', () => {
    it('VALID: {default} => creates valid byte length with default value 1024', () => {
      const result = ByteLengthStub();

      expect(result).toBe(1024);
    });

    it('VALID: {value: 2048} => creates byte length with custom value', () => {
      const result = ByteLengthStub({ value: 2048 });

      expect(result).toBe(2048);
    });
  });
});
