import { ptyDimensionContract } from './pty-dimension-contract';
import { PtyDimensionStub } from './pty-dimension.stub';

describe('ptyDimensionContract', () => {
  describe('valid dimensions', () => {
    it('VALID: {value: 80} => parses standard column width', () => {
      const dimension = PtyDimensionStub({ value: 80 });

      const result = ptyDimensionContract.parse(dimension);

      expect(result).toBe(80);
    });

    it('VALID: {value: 24} => parses standard row height', () => {
      const dimension = PtyDimensionStub({ value: 24 });

      const result = ptyDimensionContract.parse(dimension);

      expect(result).toBe(24);
    });

    it('VALID: {value: 120} => parses large column width', () => {
      const dimension = PtyDimensionStub({ value: 120 });

      const result = ptyDimensionContract.parse(dimension);

      expect(result).toBe(120);
    });
  });

  describe('invalid dimensions', () => {
    it('INVALID_DIMENSION: {value: -1} => throws validation error for negative', () => {
      expect(() => {
        return ptyDimensionContract.parse(-1);
      }).toThrow(/greater than 0/iu);
    });

    it('INVALID_DIMENSION: {value: 0} => throws validation error for zero', () => {
      expect(() => {
        return ptyDimensionContract.parse(0);
      }).toThrow(/greater than 0/iu);
    });

    it('INVALID_DIMENSION: {value: 1.5} => throws validation error for non-integer', () => {
      expect(() => {
        return ptyDimensionContract.parse(1.5);
      }).toThrow(/integer/iu);
    });
  });
});
