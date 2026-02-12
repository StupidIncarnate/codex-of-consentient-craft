import { bufferCursorIndexContract } from './buffer-cursor-index-contract';
import { BufferCursorIndexStub } from './buffer-cursor-index.stub';

describe('bufferCursorIndexContract', () => {
  describe('valid inputs', () => {
    it('VALID: {value: 0} => parses zero', () => {
      const result = bufferCursorIndexContract.parse(0);

      expect(result).toBe(0);
    });

    it('VALID: {value: 1} => parses positive integer', () => {
      const result = bufferCursorIndexContract.parse(1);

      expect(result).toBe(1);
    });

    it('VALID: {value: 500} => parses larger positive integer', () => {
      const result = bufferCursorIndexContract.parse(500);

      expect(result).toBe(500);
    });
  });

  describe('invalid inputs', () => {
    it('INVALID_VALUE: {value: -1} => throws for negative number', () => {
      expect(() => bufferCursorIndexContract.parse(-1)).toThrow(
        /Number must be greater than or equal to 0/u,
      );
    });

    it('INVALID_VALUE: {value: 1.5} => throws for non-integer', () => {
      expect(() => bufferCursorIndexContract.parse(1.5)).toThrow(/Expected integer/u);
    });

    it('INVALID_VALUE: {value: "0"} => throws for string', () => {
      expect(() => bufferCursorIndexContract.parse('0')).toThrow(/Expected number/u);
    });

    it('EMPTY: {value: null} => throws for null', () => {
      expect(() => bufferCursorIndexContract.parse(null)).toThrow(/Expected number/u);
    });

    it('EMPTY: {value: undefined} => throws for undefined', () => {
      expect(() => bufferCursorIndexContract.parse(undefined)).toThrow(/Required/u);
    });
  });

  describe('stub', () => {
    it('VALID: {default} => creates valid buffer cursor index', () => {
      const result = BufferCursorIndexStub();

      expect(result).toBe(0);
    });

    it('VALID: {value: 42} => creates buffer cursor index with custom value', () => {
      const result = BufferCursorIndexStub({ value: 42 });

      expect(result).toBe(42);
    });
  });
});
