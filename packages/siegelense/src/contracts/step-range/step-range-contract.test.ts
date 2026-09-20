import { stepRangeContract } from './step-range-contract';
import { StepRangeStub } from './step-range.stub';

describe('stepRangeContract', () => {
  describe('valid ranges', () => {
    it('VALID: {value: "4-9"} => parses a multi-step range', () => {
      const stepRange = StepRangeStub({ value: '4-9' });

      const result = stepRangeContract.parse(stepRange);

      expect(result).toBe('4-9');
    });

    it('VALID: {value: "7-7"} => a single-step range parses successfully', () => {
      const stepRange = StepRangeStub({ value: '7-7' });

      const result = stepRangeContract.parse(stepRange);

      expect(result).toBe('7-7');
    });
  });

  describe('invalid ranges', () => {
    it('INVALID: {value: "4"} => a bare number with no separator throws validation error', () => {
      expect(() => {
        stepRangeContract.parse('4');
      }).toThrow(/Invalid/u);
    });

    it('INVALID: {value: "4-"} => a missing upper bound throws validation error', () => {
      expect(() => {
        stepRangeContract.parse('4-');
      }).toThrow(/Invalid/u);
    });

    it('INVALID: {value: "a-b"} => non-numeric bounds throw validation error', () => {
      expect(() => {
        stepRangeContract.parse('a-b');
      }).toThrow(/Invalid/u);
    });
  });
});
