import { executionRoleContract } from './execution-role-contract';
import { ExecutionRoleStub } from './execution-role.stub';

describe('executionRoleContract', () => {
  describe('valid inputs', () => {
    it('VALID: {value: "codeweaver"} => parses codeweaver role', () => {
      const result = executionRoleContract.parse('codeweaver');

      expect(result).toBe('codeweaver');
    });

    it('VALID: {value: "pathseeker"} => parses pathseeker role', () => {
      const result = executionRoleContract.parse('pathseeker');

      expect(result).toBe('pathseeker');
    });

    it('VALID: {value: "ward"} => parses ward role', () => {
      const result = executionRoleContract.parse('ward');

      expect(result).toBe('ward');
    });

    it('VALID: {value: "blightwarden"} => parses blightwarden role', () => {
      const result = executionRoleContract.parse('blightwarden');

      expect(result).toBe('blightwarden');
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {value: "unknown"} => throws for invalid role', () => {
      expect(() => executionRoleContract.parse('unknown')).toThrow(/Invalid enum value/u);
    });

    it('INVALID: {value: 123} => throws for number', () => {
      expect(() => executionRoleContract.parse(123)).toThrow(/received number/u);
    });
  });

  describe('stub', () => {
    it('VALID: {default} => creates valid role with default value codeweaver', () => {
      const result = ExecutionRoleStub();

      expect(result).toBe('codeweaver');
    });

    it('VALID: {value: "ward"} => creates role with custom value', () => {
      const result = ExecutionRoleStub({ value: 'ward' });

      expect(result).toBe('ward');
    });
  });
});
