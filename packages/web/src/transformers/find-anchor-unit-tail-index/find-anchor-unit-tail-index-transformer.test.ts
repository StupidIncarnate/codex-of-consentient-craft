import { findAnchorUnitTailIndexTransformer } from './find-anchor-unit-tail-index-transformer';

describe('findAnchorUnitTailIndexTransformer', () => {
  describe('empty input', () => {
    it('EMPTY: {flags: []} => returns 0', () => {
      expect(findAnchorUnitTailIndexTransformer({ flags: [] })).toBe(0);
    });
  });

  describe('no anchor', () => {
    it('VALID: {flags: [false]} => returns 0 (last index fallback)', () => {
      expect(findAnchorUnitTailIndexTransformer({ flags: [false] })).toBe(0);
    });

    it('VALID: {flags: [false, false, false]} => returns 2 (last index fallback)', () => {
      expect(findAnchorUnitTailIndexTransformer({ flags: [false, false, false] })).toBe(2);
    });
  });

  describe('with anchor', () => {
    it('VALID: {flags: [true]} => returns 0', () => {
      expect(findAnchorUnitTailIndexTransformer({ flags: [true] })).toBe(0);
    });

    it('VALID: {flags: [true, false, false]} => returns 0', () => {
      expect(findAnchorUnitTailIndexTransformer({ flags: [true, false, false] })).toBe(0);
    });

    it('VALID: {flags: [true, false, true, false]} => returns 2 (last anchor wins)', () => {
      expect(findAnchorUnitTailIndexTransformer({ flags: [true, false, true, false] })).toBe(2);
    });

    it('VALID: {flags: [false, true, false, true]} => returns 3 (last anchor wins)', () => {
      expect(findAnchorUnitTailIndexTransformer({ flags: [false, true, false, true] })).toBe(3);
    });
  });
});
