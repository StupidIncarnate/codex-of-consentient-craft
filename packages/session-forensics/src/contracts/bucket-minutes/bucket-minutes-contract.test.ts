import { bucketMinutesContract } from './bucket-minutes-contract';
import { BucketMinutesStub } from './bucket-minutes.stub';

describe('bucketMinutesContract', () => {
  describe('valid values', () => {
    it('VALID: "5" => coerces the CLI string to 5', () => {
      const result = bucketMinutesContract.parse('5');

      expect(result).toBe(5);
    });

    it('VALID: 15 => parses a bare number the same as the default statics value', () => {
      const result = bucketMinutesContract.parse(15);

      expect(result).toBe(15);
    });
  });

  describe('invalid values', () => {
    it('INVALID: "0" => throws, a zero-width window is not a window', () => {
      expect(() => bucketMinutesContract.parse('0')).toThrow(/Number must be greater than 0/u);
    });

    it('INVALID: "-5" => throws for a negative width', () => {
      expect(() => bucketMinutesContract.parse('-5')).toThrow(/Number must be greater than 0/u);
    });

    it('INVALID: "2.5" => throws for a non-integer width', () => {
      expect(() => bucketMinutesContract.parse('2.5')).toThrow(/Expected integer, received float/u);
    });

    it('INVALID: "abc" => throws for a non-numeric string', () => {
      expect(() => bucketMinutesContract.parse('abc')).toThrow(/Expected number, received nan/u);
    });
  });

  describe('stub', () => {
    it('VALID: BucketMinutesStub() => returns the default of 5', () => {
      const result = BucketMinutesStub();

      expect(result).toBe(5);
    });

    it('VALID: BucketMinutesStub({value: "20"}) => returns the coerced custom value', () => {
      const result = BucketMinutesStub({ value: '20' });

      expect(result).toBe(20);
    });
  });
});
