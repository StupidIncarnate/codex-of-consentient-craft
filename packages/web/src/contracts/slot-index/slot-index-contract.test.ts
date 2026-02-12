import { slotIndexContract } from './slot-index-contract';
import { SlotIndexStub } from './slot-index.stub';

describe('slotIndexContract', () => {
  describe('valid inputs', () => {
    it('VALID: {value: 0} => parses zero', () => {
      const result = slotIndexContract.parse(0);

      expect(result).toBe(0);
    });

    it('VALID: {value: 5} => parses positive integer', () => {
      const result = slotIndexContract.parse(5);

      expect(result).toBe(5);
    });
  });

  describe('invalid inputs', () => {
    it('INVALID_VALUE: {value: -1} => throws for negative number', () => {
      expect(() => slotIndexContract.parse(-1)).toThrow(
        /Number must be greater than or equal to 0/u,
      );
    });

    it('INVALID_VALUE: {value: 1.5} => throws for non-integer', () => {
      expect(() => slotIndexContract.parse(1.5)).toThrow(/Expected integer/u);
    });

    it('INVALID_VALUE: {value: "0"} => throws for string', () => {
      expect(() => slotIndexContract.parse('0')).toThrow(/Expected number/u);
    });

    it('EMPTY: {value: null} => throws for null', () => {
      expect(() => slotIndexContract.parse(null)).toThrow(/Expected number/u);
    });

    it('EMPTY: {value: undefined} => throws for undefined', () => {
      expect(() => slotIndexContract.parse(undefined)).toThrow(/Required/u);
    });
  });

  describe('stub', () => {
    it('VALID: {default} => creates valid slot index', () => {
      const result = SlotIndexStub();

      expect(result).toBe(0);
    });

    it('VALID: {value: 5} => creates slot index with custom value', () => {
      const result = SlotIndexStub({ value: 5 });

      expect(result).toBe(5);
    });
  });
});
