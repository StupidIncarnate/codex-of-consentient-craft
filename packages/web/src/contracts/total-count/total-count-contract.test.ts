import { totalCountContract } from './total-count-contract';
import { TotalCountStub } from './total-count.stub';

describe('totalCountContract', () => {
  describe('valid inputs', () => {
    it('VALID: {value: 0} => parses zero', () => {
      const result = totalCountContract.parse(0);

      expect(result).toBe(0);
    });

    it('VALID: {value: 8} => parses positive integer', () => {
      const result = totalCountContract.parse(8);

      expect(result).toBe(8);
    });
  });

  describe('invalid inputs', () => {
    it('INVALID_VALUE: {value: -1} => throws for negative number', () => {
      expect(() => totalCountContract.parse(-1)).toThrow(
        /Number must be greater than or equal to 0/u,
      );
    });

    it('INVALID_VALUE: {value: 2.5} => throws for non-integer', () => {
      expect(() => totalCountContract.parse(2.5)).toThrow(/Expected integer/u);
    });

    it('INVALID_VALUE: {value: "8"} => throws for string', () => {
      expect(() => totalCountContract.parse('8')).toThrow(/Expected number/u);
    });
  });

  describe('stub', () => {
    it('VALID: {default} => creates valid total count with default value 8', () => {
      const result = TotalCountStub();

      expect(result).toBe(8);
    });

    it('VALID: {value: 10} => creates total count with custom value', () => {
      const result = TotalCountStub({ value: 10 });

      expect(result).toBe(10);
    });
  });
});
