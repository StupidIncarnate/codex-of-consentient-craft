import { scrollOffsetPxContract } from './scroll-offset-px-contract';
import { ScrollOffsetPxStub } from './scroll-offset-px.stub';

describe('scrollOffsetPxContract', () => {
  describe('valid offsets', () => {
    it('VALID: {60} => parses successfully', () => {
      expect(ScrollOffsetPxStub()).toBe(60);
    });

    it('VALID: {-120} => parses, because an anchor above the fold reads negative', () => {
      expect(scrollOffsetPxContract.parse(-120)).toBe(-120);
    });

    it('EDGE: {0} => parses successfully', () => {
      expect(scrollOffsetPxContract.parse(0)).toBe(0);
    });

    it('EDGE: {fractional} => parses, because getBoundingClientRect returns fractions', () => {
      expect(scrollOffsetPxContract.parse(12.5)).toBe(12.5);
    });
  });

  describe('invalid offsets', () => {
    it('INVALID: {non-number} => throws validation error', () => {
      expect(() => {
        scrollOffsetPxContract.parse('60');
      }).toThrow(/Expected number/u);
    });
  });
});
