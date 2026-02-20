import { cssDimensionContract } from './css-dimension-contract';
import { CssDimensionStub } from './css-dimension.stub';

describe('cssDimensionContract', () => {
  describe('valid inputs', () => {
    it('VALID: {value: "100%"} => parses string dimension', () => {
      const result = cssDimensionContract.parse('100%');

      expect(result).toBe('100%');
    });

    it('VALID: {value: 200} => parses number dimension', () => {
      const result = cssDimensionContract.parse(200);

      expect(result).toBe(200);
    });
  });

  describe('invalid inputs', () => {
    it('EMPTY: {value: null} => throws for null', () => {
      expect(() => cssDimensionContract.parse(null)).toThrow(/Invalid input/u);
    });

    it('INVALID_VALUE: {value: true} => throws for boolean', () => {
      expect(() => cssDimensionContract.parse(true)).toThrow(/Invalid input/u);
    });
  });

  describe('stub', () => {
    it('VALID: {default} => creates valid dimension', () => {
      const result = CssDimensionStub();

      expect(result).toBe('100%');
    });

    it('VALID: {value: 300} => creates dimension with custom value', () => {
      const result = CssDimensionStub({ value: 300 });

      expect(result).toBe(300);
    });
  });
});
