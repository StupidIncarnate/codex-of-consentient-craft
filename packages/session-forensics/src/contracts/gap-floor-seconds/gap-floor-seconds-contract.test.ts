import { gapFloorSecondsContract } from './gap-floor-seconds-contract';
import { GapFloorSecondsStub } from './gap-floor-seconds.stub';

describe('gapFloorSecondsContract', () => {
  describe('valid values', () => {
    it('VALID: "30" => coerces the CLI string to 30', () => {
      const result = gapFloorSecondsContract.parse('30');

      expect(result).toBe(30);
    });

    it('VALID: 120 => parses a bare number the same as the default statics value', () => {
      const result = gapFloorSecondsContract.parse(120);

      expect(result).toBe(120);
    });
  });

  describe('invalid values', () => {
    it('INVALID: "0" => throws, a zero-second floor is not a floor', () => {
      expect(() => gapFloorSecondsContract.parse('0')).toThrow(/expected number to be >0/u);
    });

    it('INVALID: "-30" => throws for a negative floor', () => {
      expect(() => gapFloorSecondsContract.parse('-30')).toThrow(/expected number to be >0/u);
    });

    it('INVALID: "2.5" => throws for a non-integer floor', () => {
      expect(() => gapFloorSecondsContract.parse('2.5')).toThrow(/expected int, received number/u);
    });

    it('INVALID: "abc" => throws for a non-numeric string', () => {
      expect(() => gapFloorSecondsContract.parse('abc')).toThrow(/expected number, received NaN/u);
    });
  });

  describe('stub', () => {
    it('VALID: GapFloorSecondsStub() => returns the default of 30', () => {
      const result = GapFloorSecondsStub();

      expect(result).toBe(30);
    });

    it('VALID: GapFloorSecondsStub({value: "60"}) => returns the coerced custom value', () => {
      const result = GapFloorSecondsStub({ value: '60' });

      expect(result).toBe(60);
    });
  });
});
