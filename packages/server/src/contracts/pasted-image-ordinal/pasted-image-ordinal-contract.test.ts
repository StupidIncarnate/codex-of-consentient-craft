import { pastedImageOrdinalContract } from './pasted-image-ordinal-contract';
import { PastedImageOrdinalStub } from './pasted-image-ordinal.stub';

describe('pastedImageOrdinalContract', () => {
  describe('valid inputs', () => {
    it('VALID: {value: 1} => parses the first ordinal', () => {
      const result = pastedImageOrdinalContract.parse(1);

      expect(result).toBe(1);
    });

    it('VALID: {value: 5} => parses a later ordinal', () => {
      const result = pastedImageOrdinalContract.parse(5);

      expect(result).toBe(5);
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {value: 0} => throws for a non-positive number', () => {
      expect(() => pastedImageOrdinalContract.parse(0)).toThrow(/greater than 0/u);
    });

    it('INVALID: {value: -1} => throws for a negative number', () => {
      expect(() => pastedImageOrdinalContract.parse(-1)).toThrow(/greater than 0/u);
    });

    it('INVALID: {value: 1.5} => throws for a non-integer number', () => {
      expect(() => pastedImageOrdinalContract.parse(1.5)).toThrow(/integer/u);
    });

    it('INVALID: {value: "1"} => throws for a string', () => {
      expect(() => pastedImageOrdinalContract.parse('1')).toThrow(/Expected number/u);
    });

    it('EMPTY: {value: undefined} => throws for undefined', () => {
      expect(() => pastedImageOrdinalContract.parse(undefined)).toThrow(/Required/u);
    });
  });

  describe('stub', () => {
    it('VALID: {default} => creates ordinal 1', () => {
      const result = PastedImageOrdinalStub();

      expect(result).toBe(1);
    });

    it('VALID: {value: 3} => creates a custom ordinal', () => {
      const result = PastedImageOrdinalStub({ value: 3 });

      expect(result).toBe(3);
    });
  });
});
