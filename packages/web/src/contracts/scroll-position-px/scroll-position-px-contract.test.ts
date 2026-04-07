import { scrollPositionPxContract } from './scroll-position-px-contract';
import { ScrollPositionPxStub } from './scroll-position-px.stub';

describe('scrollPositionPxContract', () => {
  describe('valid inputs', () => {
    it('VALID: {value: 0} => parses zero position', () => {
      const result = scrollPositionPxContract.parse(0);

      expect(result).toBe(0);
    });

    it('VALID: {value: 500} => parses positive position', () => {
      const result = scrollPositionPxContract.parse(500);

      expect(result).toBe(500);
    });

    it('VALID: {value: 0.5} => parses fractional position', () => {
      const result = scrollPositionPxContract.parse(0.5);

      expect(result).toBe(0.5);
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {value: -1} => throws for negative', () => {
      expect(() => scrollPositionPxContract.parse(-1)).toThrow(/too_small/u);
    });
  });

  describe('stub', () => {
    it('VALID: {default} => creates valid position with default value 0', () => {
      const result = ScrollPositionPxStub();

      expect(result).toBe(0);
    });

    it('VALID: {value: 300} => creates position with custom value', () => {
      const result = ScrollPositionPxStub({ value: 300 });

      expect(result).toBe(300);
    });
  });
});
