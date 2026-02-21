import { contextTokenDeltaContract } from './context-token-delta-contract';
import { ContextTokenDeltaStub } from './context-token-delta.stub';

describe('contextTokenDeltaContract', () => {
  describe('valid inputs', () => {
    it('VALID: {value: 0} => parses zero', () => {
      const result = contextTokenDeltaContract.parse(0);

      expect(result).toBe(0);
    });

    it('VALID: {value: 2100} => parses positive integer', () => {
      const result = contextTokenDeltaContract.parse(2100);

      expect(result).toBe(2100);
    });

    it('VALID: {value: -3682} => parses negative integer', () => {
      const result = contextTokenDeltaContract.parse(-3682);

      expect(result).toBe(-3682);
    });
  });

  describe('invalid inputs', () => {
    it('INVALID_VALUE: {value: 1.5} => throws for non-integer', () => {
      expect(() => contextTokenDeltaContract.parse(1.5)).toThrow(/Expected integer/u);
    });

    it('INVALID_VALUE: {value: "0"} => throws for string', () => {
      expect(() => contextTokenDeltaContract.parse('0')).toThrow(/Expected number/u);
    });

    it('EMPTY: {value: null} => throws for null', () => {
      expect(() => contextTokenDeltaContract.parse(null)).toThrow(/Expected number/u);
    });

    it('EMPTY: {value: undefined} => throws for undefined', () => {
      expect(() => contextTokenDeltaContract.parse(undefined)).toThrow(/Required/u);
    });
  });

  describe('stub', () => {
    it('VALID: {default} => creates valid context token delta with default value 2100', () => {
      const result = ContextTokenDeltaStub();

      expect(result).toBe(2100);
    });

    it('VALID: {value: -500} => creates context token delta with negative value', () => {
      const result = ContextTokenDeltaStub({ value: -500 });

      expect(result).toBe(-500);
    });
  });
});
