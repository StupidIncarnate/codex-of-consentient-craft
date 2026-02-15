import { bounceOffsetPxContract } from './bounce-offset-px-contract';
import { BounceOffsetPxStub } from './bounce-offset-px.stub';

describe('bounceOffsetPxContract', () => {
  describe('valid inputs', () => {
    it('VALID: {value: 0} => parses zero offset', () => {
      const result = bounceOffsetPxContract.parse(0);

      expect(result).toBe(0);
    });

    it('VALID: {value: -4} => parses negative offset', () => {
      const result = bounceOffsetPxContract.parse(-4);

      expect(result).toBe(-4);
    });

    it('VALID: {value: 4} => parses positive offset', () => {
      const result = bounceOffsetPxContract.parse(4);

      expect(result).toBe(4);
    });
  });

  describe('invalid inputs', () => {
    it('INVALID_VALUE: {value: 1.5} => throws for non-integer', () => {
      expect(() => bounceOffsetPxContract.parse(1.5)).toThrow(/Expected integer/u);
    });

    it('INVALID_VALUE: {value: "0"} => throws for string', () => {
      expect(() => bounceOffsetPxContract.parse('0')).toThrow(/Expected number/u);
    });
  });

  describe('stub', () => {
    it('VALID: {default} => creates valid offset with default value 0', () => {
      const result = BounceOffsetPxStub();

      expect(result).toBe(0);
    });

    it('VALID: {value: -4} => creates offset with custom value', () => {
      const result = BounceOffsetPxStub({ value: -4 });

      expect(result).toBe(-4);
    });
  });
});
