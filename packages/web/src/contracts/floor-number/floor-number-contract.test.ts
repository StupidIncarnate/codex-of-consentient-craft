import { floorNumberContract } from './floor-number-contract';
import { FloorNumberStub } from './floor-number.stub';

describe('floorNumberContract', () => {
  describe('valid inputs', () => {
    it('VALID: {value: 1} => parses positive integer', () => {
      const result = floorNumberContract.parse(1);

      expect(result).toBe(1);
    });

    it('VALID: {value: 5} => parses larger positive integer', () => {
      const result = floorNumberContract.parse(5);

      expect(result).toBe(5);
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {value: 0} => throws for zero', () => {
      expect(() => floorNumberContract.parse(0)).toThrow(/Number must be greater than 0/u);
    });

    it('INVALID: {value: -1} => throws for negative', () => {
      expect(() => floorNumberContract.parse(-1)).toThrow(/Number must be greater than 0/u);
    });

    it('INVALID: {value: 1.5} => throws for non-integer', () => {
      expect(() => floorNumberContract.parse(1.5)).toThrow(/Expected integer/u);
    });
  });

  describe('stub', () => {
    it('VALID: {default} => creates valid floor number with default value 1', () => {
      const result = FloorNumberStub();

      expect(result).toBe(1);
    });

    it('VALID: {value: 3} => creates floor number with custom value', () => {
      const result = FloorNumberStub({ value: 3 });

      expect(result).toBe(3);
    });
  });
});
