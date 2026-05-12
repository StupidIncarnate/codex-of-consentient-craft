import { tailStartIndexContract } from './tail-start-index-contract';
import { TailStartIndexStub } from './tail-start-index.stub';

describe('tailStartIndexContract', () => {
  describe('valid inputs', () => {
    it('VALID: {value: 0} => parses zero', () => {
      const result = tailStartIndexContract.parse(0);

      expect(result).toBe(0);
    });

    it('VALID: {value: 1} => parses positive integer', () => {
      const result = tailStartIndexContract.parse(1);

      expect(result).toBe(1);
    });

    it('VALID: {value: 42} => parses larger positive integer', () => {
      const result = tailStartIndexContract.parse(42);

      expect(result).toBe(42);
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {value: -1} => throws for negative number', () => {
      expect(() => tailStartIndexContract.parse(-1)).toThrow(
        /Number must be greater than or equal to 0/u,
      );
    });

    it('INVALID: {value: 1.5} => throws for non-integer', () => {
      expect(() => tailStartIndexContract.parse(1.5)).toThrow(/Expected integer/u);
    });

    it('INVALID: {value: "0"} => throws for string', () => {
      expect(() => tailStartIndexContract.parse('0')).toThrow(/Expected number/u);
    });

    it('EMPTY: {value: null} => throws for null', () => {
      expect(() => tailStartIndexContract.parse(null)).toThrow(/Expected number/u);
    });

    it('EMPTY: {value: undefined} => throws for undefined', () => {
      expect(() => tailStartIndexContract.parse(undefined)).toThrow(/Required/u);
    });
  });

  describe('stub', () => {
    it('VALID: {default} => creates valid tail start index with default value 0', () => {
      const result = TailStartIndexStub();

      expect(result).toBe(0);
    });

    it('VALID: {value: 5} => creates tail start index with custom value', () => {
      const result = TailStartIndexStub({ value: 5 });

      expect(result).toBe(5);
    });
  });
});
