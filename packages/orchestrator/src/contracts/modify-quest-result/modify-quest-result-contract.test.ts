import { VerifyQuestCheckStub } from '../verify-quest-check/verify-quest-check.stub';
import { modifyQuestResultContract } from './modify-quest-result-contract';
import { ModifyQuestResultStub } from './modify-quest-result.stub';

describe('modifyQuestResultContract', () => {
  describe('valid results', () => {
    it('VALID: {success: true} => parses successfully', () => {
      const result = ModifyQuestResultStub({ success: true });

      const parsed = modifyQuestResultContract.parse(result);

      expect(parsed).toStrictEqual({ success: true });
    });

    it('VALID: {success: false, error} => parses error result', () => {
      const result = modifyQuestResultContract.parse({
        success: false,
        error: 'Quest not found',
      });

      expect(result).toStrictEqual({
        success: false,
        error: 'Quest not found',
      });
    });

    it('VALID: {success: false, error, failedChecks} => parses with failed checks', () => {
      const failedCheck = VerifyQuestCheckStub({
        name: 'Flow ID Uniqueness',
        passed: false,
        details: "Duplicate flow ids: 'login'",
      });

      const result = modifyQuestResultContract.parse({
        success: false,
        error: 'Save invariants failed',
        failedChecks: [failedCheck],
      });

      expect(result).toStrictEqual({
        success: false,
        error: 'Save invariants failed',
        failedChecks: [failedCheck],
      });
    });

    it('VALID: {stub default} => parses with default success', () => {
      const result = ModifyQuestResultStub();

      const parsed = modifyQuestResultContract.parse(result);

      expect(parsed).toStrictEqual({ success: true });
    });
  });

  describe('invalid results', () => {
    it('INVALID: {missing success} => throws validation error', () => {
      expect(() => {
        return modifyQuestResultContract.parse({});
      }).toThrow(/Required/u);
    });

    it('INVALID: {success: "true"} => throws validation error', () => {
      expect(() => {
        return modifyQuestResultContract.parse({ success: 'true' });
      }).toThrow(/Expected boolean/u);
    });
  });
});
