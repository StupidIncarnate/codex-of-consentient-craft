import { stepNameContract } from './step-name-contract';
import { StepNameStub } from './step-name.stub';

describe('stepNameContract', () => {
  describe('valid step names', () => {
    it('VALID: {default stub} => parses successfully', () => {
      const stepName = StepNameStub();

      const result = stepNameContract.parse(stepName);

      expect(result).toBe('implement-auth-middleware');
    });

    it('VALID: {custom name} => parses successfully', () => {
      const stepName = StepNameStub({ value: 'create-user-model' });

      const result = stepNameContract.parse(stepName);

      expect(result).toBe('create-user-model');
    });

    it('VALID: {empty string} => parses successfully', () => {
      const stepName = StepNameStub({ value: '' });

      const result = stepNameContract.parse(stepName);

      expect(result).toBe('');
    });
  });
});
