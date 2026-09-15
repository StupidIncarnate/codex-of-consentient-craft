import { stepExpectationContract } from './step-expectation-contract';
import { StepExpectationStub } from './step-expectation.stub';

describe('stepExpectationContract', () => {
  describe('valid members', () => {
    it.each(stepExpectationContract.unwrap().options)(
      'VALID: {value: %s} => parses to itself',
      (value) => {
        const stepExpectation = StepExpectationStub({ value });

        const result = stepExpectationContract.parse(stepExpectation);

        expect(result).toBe(value);
      },
    );
  });

  describe('invalid members', () => {
    it('INVALID: {value: "skip"} => an unlisted string throws validation error', () => {
      expect(() => {
        StepExpectationStub({ value: 'skip' as never });
      }).toThrow(/Invalid enum value/u);
    });
  });

  describe('edge cases', () => {
    it('EDGE: {value: "OK"} => an uppercase variant of a valid member throws validation error', () => {
      expect(() => {
        stepExpectationContract.parse('OK');
      }).toThrow(/Invalid enum value/u);
    });
  });
});
