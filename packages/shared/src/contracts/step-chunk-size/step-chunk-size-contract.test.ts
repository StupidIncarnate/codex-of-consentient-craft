import { stepChunkSizeContract } from './step-chunk-size-contract';
import { StepChunkSizeStub } from './step-chunk-size.stub';

describe('stepChunkSizeContract', () => {
  describe('valid cap values', () => {
    it('VALID: 1 => parses minimum positive integer to StepChunkSize branded type', () => {
      const result = stepChunkSizeContract.parse(1);

      expect(result).toBe(1);
    });

    it('VALID: 6 => parses default cap to StepChunkSize branded type', () => {
      const result = stepChunkSizeContract.parse(6);

      expect(result).toBe(6);
    });

    it('VALID: 1000 => parses large value to StepChunkSize branded type', () => {
      const result = stepChunkSizeContract.parse(1000);

      expect(result).toBe(1000);
    });
  });

  describe('invalid cap values', () => {
    it('ERROR: 0 => throws for zero (cap must allow at least one step per chunk)', () => {
      expect(() => stepChunkSizeContract.parse(0)).toThrow(
        /Number must be greater than or equal to 1/u,
      );
    });

    it('ERROR: -1 => throws for negative number', () => {
      expect(() => stepChunkSizeContract.parse(-1)).toThrow(
        /Number must be greater than or equal to 1/u,
      );
    });

    it('ERROR: 1.5 => throws for non-integer', () => {
      expect(() => stepChunkSizeContract.parse(1.5)).toThrow(/Expected integer, received float/u);
    });

    it('ERROR: "6" => throws for string', () => {
      expect(() => stepChunkSizeContract.parse('6')).toThrow(/Expected number, received string/u);
    });
  });

  describe('stub', () => {
    it('VALID: StepChunkSizeStub() => returns default cap of 6', () => {
      const result = StepChunkSizeStub();

      expect(result).toBe(6);
    });

    it('VALID: StepChunkSizeStub({value: 3}) => returns custom value', () => {
      const result = StepChunkSizeStub({ value: 3 });

      expect(result).toBe(3);
    });
  });
});
