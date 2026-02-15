import { scrollThresholdPxContract } from './scroll-threshold-px-contract';
import { ScrollThresholdPxStub } from './scroll-threshold-px.stub';

describe('scrollThresholdPxContract', () => {
  describe('valid inputs', () => {
    it('VALID: {value: 0} => parses zero threshold', () => {
      const result = scrollThresholdPxContract.parse(0);

      expect(result).toBe(0);
    });

    it('VALID: {value: 10} => parses standard threshold', () => {
      const result = scrollThresholdPxContract.parse(10);

      expect(result).toBe(10);
    });
  });

  describe('invalid inputs', () => {
    it('INVALID_VALUE: {value: -1} => throws for negative', () => {
      expect(() => scrollThresholdPxContract.parse(-1)).toThrow(/too_small/u);
    });

    it('INVALID_VALUE: {value: 1.5} => throws for non-integer', () => {
      expect(() => scrollThresholdPxContract.parse(1.5)).toThrow(/Expected integer/u);
    });
  });

  describe('stub', () => {
    it('VALID: {default} => creates valid threshold with default value 10', () => {
      const result = ScrollThresholdPxStub();

      expect(result).toBe(10);
    });

    it('VALID: {value: 20} => creates threshold with custom value', () => {
      const result = ScrollThresholdPxStub({ value: 20 });

      expect(result).toBe(20);
    });
  });
});
