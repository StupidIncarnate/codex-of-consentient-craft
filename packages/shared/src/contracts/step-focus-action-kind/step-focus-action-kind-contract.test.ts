import { stepFocusActionKindContract } from './step-focus-action-kind-contract';
import { StepFocusActionKindStub } from './step-focus-action-kind.stub';

describe('stepFocusActionKindContract', () => {
  describe('valid values', () => {
    it('VALID: {value: "verification"} => parses successfully', () => {
      const result = stepFocusActionKindContract.parse('verification');

      expect(result).toBe('verification');
    });

    it('VALID: {value: "command"} => parses successfully', () => {
      const result = stepFocusActionKindContract.parse('command');

      expect(result).toBe('command');
    });

    it('VALID: {value: "sweep-check"} => parses successfully', () => {
      const result = stepFocusActionKindContract.parse('sweep-check');

      expect(result).toBe('sweep-check');
    });

    it('VALID: {value: "custom"} => parses successfully', () => {
      const result = stepFocusActionKindContract.parse('custom');

      expect(result).toBe('custom');
    });

    it('VALID: {default stub} => returns verification', () => {
      const value = StepFocusActionKindStub();

      expect(value).toBe('verification');
    });
  });

  describe('invalid values', () => {
    it('INVALID: {value: "file"} => throws validation error', () => {
      expect(() => {
        stepFocusActionKindContract.parse('file');
      }).toThrow(/Invalid enum value/u);
    });

    it('INVALID: {value: ""} => throws validation error', () => {
      expect(() => {
        stepFocusActionKindContract.parse('');
      }).toThrow(/Invalid enum value/u);
    });
  });
});
