import { stickyZIndexContract } from './sticky-z-index-contract';
import { StickyZIndexStub } from './sticky-z-index.stub';
import { stickyHeaderStatics } from '../../statics/sticky-header/sticky-header-statics';

describe('stickyZIndexContract', () => {
  describe('valid inputs', () => {
    it('VALID: {value: 100} => parses the band the outermost header paints at', () => {
      const result = stickyZIndexContract.parse(stickyHeaderStatics.zIndexBase);

      expect(result).toBe(100);
    });

    it('EDGE: {value: 1} => parses the floor itself', () => {
      const result = stickyZIndexContract.parse(stickyHeaderStatics.zIndexFloor);

      expect(result).toBe(1);
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {value: 0} => throws below the floor, where a header paints behind its container', () => {
      expect(() => stickyZIndexContract.parse(0)).toThrow(/too_small/u);
    });

    it('INVALID: {value: -5} => throws for a negative band', () => {
      expect(() => stickyZIndexContract.parse(-5)).toThrow(/too_small/u);
    });

    it('INVALID: {value: 12.5} => throws for a fractional band', () => {
      expect(() => stickyZIndexContract.parse(12.5)).toThrow(/expected int/iu);
    });
  });

  describe('stub', () => {
    it('VALID: {default} => creates the base band', () => {
      const result = StickyZIndexStub();

      expect(result).toBe(100);
    });

    it('VALID: {value: 46} => creates a custom band', () => {
      const result = StickyZIndexStub({ value: 46 });

      expect(result).toBe(46);
    });
  });
});
