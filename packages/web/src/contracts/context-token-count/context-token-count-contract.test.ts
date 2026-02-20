import { contextTokenCountContract } from './context-token-count-contract';
import { ContextTokenCountStub } from './context-token-count.stub';

describe('contextTokenCountContract', () => {
  describe('valid inputs', () => {
    it('VALID: {value: 0} => parses zero', () => {
      const result = contextTokenCountContract.parse(0);

      expect(result).toBe(0);
    });

    it('VALID: {value: 1} => parses positive integer', () => {
      const result = contextTokenCountContract.parse(1);

      expect(result).toBe(1);
    });

    it('VALID: {value: 29448} => parses larger positive integer', () => {
      const result = contextTokenCountContract.parse(29448);

      expect(result).toBe(29448);
    });
  });

  describe('invalid inputs', () => {
    it('INVALID_VALUE: {value: -1} => throws for negative number', () => {
      expect(() => contextTokenCountContract.parse(-1)).toThrow(
        /Number must be greater than or equal to 0/u,
      );
    });

    it('INVALID_VALUE: {value: 1.5} => throws for non-integer', () => {
      expect(() => contextTokenCountContract.parse(1.5)).toThrow(/Expected integer/u);
    });

    it('INVALID_VALUE: {value: "0"} => throws for string', () => {
      expect(() => contextTokenCountContract.parse('0')).toThrow(/Expected number/u);
    });

    it('EMPTY: {value: null} => throws for null', () => {
      expect(() => contextTokenCountContract.parse(null)).toThrow(/Expected number/u);
    });

    it('EMPTY: {value: undefined} => throws for undefined', () => {
      expect(() => contextTokenCountContract.parse(undefined)).toThrow(/Required/u);
    });
  });

  describe('stub', () => {
    it('VALID: {default} => creates valid context token count with default value 29448', () => {
      const result = ContextTokenCountStub();

      expect(result).toBe(29448);
    });

    it('VALID: {value: 5000} => creates context token count with custom value', () => {
      const result = ContextTokenCountStub({ value: 5000 });

      expect(result).toBe(5000);
    });
  });
});
