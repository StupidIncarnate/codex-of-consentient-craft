import { stepNameContract } from './step-name-contract';
import { StepNameStub } from './step-name.stub';

describe('stepNameContract', () => {
  describe('valid inputs', () => {
    it('VALID: {value: "Build user auth flow"} => parses valid step name', () => {
      const result = stepNameContract.parse('Build user auth flow');

      expect(result).toBe('Build user auth flow');
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {value: ""} => throws for empty string', () => {
      expect(() => stepNameContract.parse('')).toThrow(/String must contain at least 1/u);
    });

    it('INVALID: {value: 123} => throws for number', () => {
      expect(() => stepNameContract.parse(123)).toThrow(/Expected string/u);
    });
  });

  describe('stub', () => {
    it('VALID: {default} => creates valid step name with default value', () => {
      const result = StepNameStub();

      expect(result).toBe('Build user auth flow');
    });

    it('VALID: {value: "Run tests"} => creates step name with custom value', () => {
      const result = StepNameStub({ value: 'Run tests' });

      expect(result).toBe('Run tests');
    });
  });
});
