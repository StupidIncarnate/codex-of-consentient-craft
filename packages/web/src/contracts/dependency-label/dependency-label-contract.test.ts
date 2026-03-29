import { dependencyLabelContract } from './dependency-label-contract';
import { DependencyLabelStub } from './dependency-label.stub';

describe('dependencyLabelContract', () => {
  describe('valid inputs', () => {
    it('VALID: {value: "step-1"} => parses valid label', () => {
      const result = dependencyLabelContract.parse('step-1');

      expect(result).toBe('step-1');
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {value: ""} => throws for empty string', () => {
      expect(() => dependencyLabelContract.parse('')).toThrow(/String must contain at least 1/u);
    });
  });

  describe('stub', () => {
    it('VALID: {default} => creates valid dependency label', () => {
      const result = DependencyLabelStub();

      expect(result).toBe('step-1');
    });

    it('VALID: {value: "step-2"} => creates with custom value', () => {
      const result = DependencyLabelStub({ value: 'step-2' });

      expect(result).toBe('step-2');
    });
  });
});
