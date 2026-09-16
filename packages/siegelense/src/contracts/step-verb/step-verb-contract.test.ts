import { stepStatics } from '../../statics/step/step-statics';

import { stepVerbContract } from './step-verb-contract';
import { StepVerbStub } from './step-verb.stub';

describe('stepVerbContract', () => {
  describe('valid members', () => {
    it.each(stepStatics.verbs.all)('VALID: {value: %s} => parses to itself', (value) => {
      const stepVerb = StepVerbStub({ value });

      const result = stepVerbContract.parse(stepVerb);

      expect(result).toBe(value);
    });
  });

  describe('invalid members', () => {
    it('INVALID: {value: "hover"} => an unlisted string throws validation error', () => {
      expect(() => {
        StepVerbStub({ value: 'hover' as never });
      }).toThrow(/Invalid enum value/u);
    });
  });

  describe('edge cases', () => {
    it('EDGE: {value: "Click"} => a mismatched-case variant of a valid member throws validation error', () => {
      expect(() => {
        stepVerbContract.parse('Click');
      }).toThrow(/Invalid enum value/u);
    });
  });
});
