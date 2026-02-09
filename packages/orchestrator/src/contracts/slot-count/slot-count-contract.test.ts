import { slotCountContract } from './slot-count-contract';
import { SlotCountStub } from './slot-count.stub';

describe('slotCountContract', () => {
  describe('valid inputs', () => {
    it('VALID: {value: 0} => parses zero', () => {
      const result = slotCountContract.parse(0);

      expect(result).toBe(0);
    });

    it('VALID: {value: 1} => parses positive integer', () => {
      const result = slotCountContract.parse(1);

      expect(result).toBe(1);
    });

    it('VALID: {value: 10} => parses larger positive integer', () => {
      const result = slotCountContract.parse(10);

      expect(result).toBe(10);
    });
  });

  describe('invalid inputs', () => {
    it('INVALID_VALUE: {value: -1} => throws for negative number', () => {
      expect(() => slotCountContract.parse(-1)).toThrow(
        /Number must be greater than or equal to 0/u,
      );
    });

    it('INVALID_VALUE: {value: 1.5} => throws for non-integer', () => {
      expect(() => slotCountContract.parse(1.5)).toThrow(/Expected integer/u);
    });

    it('INVALID_VALUE: {value: "0"} => throws for string', () => {
      expect(() => slotCountContract.parse('0')).toThrow(/Expected number/u);
    });

    it('INVALID_VALUE: {value: null} => throws for null', () => {
      expect(() => slotCountContract.parse(null)).toThrow(/Expected number/u);
    });

    it('INVALID_VALUE: {value: undefined} => throws for undefined', () => {
      expect(() => slotCountContract.parse(undefined)).toThrow(/Required/u);
    });
  });

  describe('stub', () => {
    it('VALID: {default} => creates valid slot count with default value 3', () => {
      const result = SlotCountStub();

      expect(result).toBe(3);
    });

    it('VALID: {value: 5} => creates slot count with custom value', () => {
      const result = SlotCountStub({ value: 5 });

      expect(result).toBe(5);
    });
  });
});
