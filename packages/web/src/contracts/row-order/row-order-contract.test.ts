import { rowOrderContract } from './row-order-contract';
import { RowOrderStub } from './row-order.stub';

describe('rowOrderContract', () => {
  describe('valid inputs', () => {
    it('VALID: {value: 1} => parses first row order', () => {
      const result = rowOrderContract.parse(1);

      expect(result).toBe(1);
    });

    it('VALID: {value: 42} => parses larger row order', () => {
      const result = rowOrderContract.parse(42);

      expect(result).toBe(42);
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {value: 0} => throws for zero (row order is 1-based)', () => {
      expect(() => rowOrderContract.parse(0)).toThrow(/greater than 0/u);
    });

    it('INVALID: {value: -1} => throws for negative number', () => {
      expect(() => rowOrderContract.parse(-1)).toThrow(/greater than 0/u);
    });

    it('INVALID: {value: 1.5} => throws for non-integer', () => {
      expect(() => rowOrderContract.parse(1.5)).toThrow(/integer/u);
    });

    it('INVALID: {value: "1"} => throws for string', () => {
      expect(() => rowOrderContract.parse('1')).toThrow(/received string/u);
    });
  });

  describe('stub', () => {
    it('VALID: {default} => creates row order with default value 1', () => {
      const result = RowOrderStub();

      expect(result).toBe(1);
    });

    it('VALID: {value: 5} => creates row order with custom value', () => {
      const result = RowOrderStub({ value: 5 });

      expect(result).toBe(5);
    });
  });
});
