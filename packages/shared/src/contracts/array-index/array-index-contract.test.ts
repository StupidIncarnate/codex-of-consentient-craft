import { arrayIndexContract } from './array-index-contract';
import { ArrayIndexStub } from './array-index.stub';

describe('arrayIndexContract', () => {
  describe('valid index values', () => {
    it('VALID: 0 => parses zero to ArrayIndex branded type', () => {
      const result = arrayIndexContract.parse(0);

      expect(result).toBe(0);
    });

    it('VALID: 5 => parses positive integer to ArrayIndex branded type', () => {
      const result = arrayIndexContract.parse(5);

      expect(result).toBe(5);
    });

    it('VALID: 1000 => parses large value to ArrayIndex branded type', () => {
      const result = arrayIndexContract.parse(1000);

      expect(result).toBe(1000);
    });
  });

  describe('invalid index values', () => {
    it('ERROR: -1 => throws for negative number', () => {
      expect(() => arrayIndexContract.parse(-1)).toThrow(
        /Number must be greater than or equal to 0/u,
      );
    });

    it('ERROR: 1.5 => throws for non-integer', () => {
      expect(() => arrayIndexContract.parse(1.5)).toThrow(/Expected integer, received float/u);
    });

    it('ERROR: "0" => throws for string', () => {
      expect(() => arrayIndexContract.parse('0')).toThrow(/Expected number, received string/u);
    });
  });

  describe('stub', () => {
    it('VALID: ArrayIndexStub() => returns default stub value', () => {
      const result = ArrayIndexStub();

      expect(result).toBe(0);
    });

    it('VALID: ArrayIndexStub({value: 3}) => returns custom value', () => {
      const result = ArrayIndexStub({ value: 3 });

      expect(result).toBe(3);
    });
  });
});
