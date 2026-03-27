import { durationMsContract } from './duration-ms-contract';
import { DurationMsStub } from './duration-ms.stub';

describe('durationMsContract', () => {
  describe('valid inputs', () => {
    it('VALID: {positive number} => parses successfully', () => {
      const result = durationMsContract.parse(150);

      expect(result).toBe(150);
    });

    it('VALID: {zero} => parses successfully', () => {
      const result = durationMsContract.parse(0);

      expect(result).toBe(0);
    });

    it('VALID: {decimal value} => parses successfully', () => {
      const result = durationMsContract.parse(12.5);

      expect(result).toBe(12.5);
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {negative number} => throws validation error', () => {
      expect(() => durationMsContract.parse(-1)).toThrow(/too_small/u);
    });

    it('INVALID: {NaN} => throws validation error', () => {
      expect(() => durationMsContract.parse(Number.NaN)).toThrow(/Expected number, received nan/u);
    });

    it('INVALID: {string} => throws validation error', () => {
      expect(() => durationMsContract.parse('100' as never)).toThrow(/Expected number/u);
    });
  });

  describe('stub', () => {
    it('VALID: {default} => creates duration of 100', () => {
      const result = DurationMsStub();

      expect(result).toBe(100);
    });

    it('VALID: {custom value} => creates duration with override', () => {
      const result = DurationMsStub({ value: 5000 });

      expect(result).toBe(5000);
    });
  });
});
