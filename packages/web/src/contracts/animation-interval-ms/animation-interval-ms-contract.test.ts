import { animationIntervalMsContract } from './animation-interval-ms-contract';
import { AnimationIntervalMsStub } from './animation-interval-ms.stub';

describe('animationIntervalMsContract', () => {
  describe('valid inputs', () => {
    it('VALID: {value: 300} => parses fast interval', () => {
      const result = animationIntervalMsContract.parse(300);

      expect(result).toBe(300);
    });

    it('VALID: {value: 2000} => parses standard interval', () => {
      const result = animationIntervalMsContract.parse(2000);

      expect(result).toBe(2000);
    });
  });

  describe('invalid inputs', () => {
    it('INVALID_VALUE: {value: 0} => throws for zero', () => {
      expect(() => animationIntervalMsContract.parse(0)).toThrow(/Number must be greater than 0/u);
    });

    it('INVALID_VALUE: {value: -100} => throws for negative', () => {
      expect(() => animationIntervalMsContract.parse(-100)).toThrow(
        /Number must be greater than 0/u,
      );
    });

    it('INVALID_VALUE: {value: 1.5} => throws for non-integer', () => {
      expect(() => animationIntervalMsContract.parse(1.5)).toThrow(/Expected integer/u);
    });
  });

  describe('stub', () => {
    it('VALID: {default} => creates valid interval with default value 2000', () => {
      const result = AnimationIntervalMsStub();

      expect(result).toBe(2000);
    });

    it('VALID: {value: 500} => creates interval with custom value', () => {
      const result = AnimationIntervalMsStub({ value: 500 });

      expect(result).toBe(500);
    });
  });
});
