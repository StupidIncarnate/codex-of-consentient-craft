import { verifyQuestResultContract } from './verify-quest-result-contract';
import { VerifyQuestResultStub } from './verify-quest-result.stub';

describe('verifyQuestResultContract', () => {
  describe('valid results', () => {
    it('VALID: {success: true, checks: []} => parses successfully', () => {
      const result = VerifyQuestResultStub();

      const parsed = verifyQuestResultContract.parse(result);

      expect(parsed).toStrictEqual({ success: true, checks: [] });
    });

    it('VALID: {success: true, checks with items} => parses with check data', () => {
      const result = VerifyQuestResultStub({
        success: true,
        checks: [{ name: 'Observable Coverage', passed: true, details: 'All observables covered' }],
      });

      const parsed = verifyQuestResultContract.parse(result);

      expect(parsed).toStrictEqual({
        success: true,
        checks: [{ name: 'Observable Coverage', passed: true, details: 'All observables covered' }],
      });
    });

    it('VALID: {success: false, checks, error} => parses with error message', () => {
      const result = VerifyQuestResultStub({
        success: false,
        checks: [{ name: 'Dependency Integrity', passed: false, details: 'Missing dependency' }],
        error: 'Verification failed',
      });

      const parsed = verifyQuestResultContract.parse(result);

      expect(parsed).toStrictEqual({
        success: false,
        checks: [{ name: 'Dependency Integrity', passed: false, details: 'Missing dependency' }],
        error: 'Verification failed',
      });
    });
  });

  describe('invalid results', () => {
    it('INVALID_MULTIPLE: {missing success and checks} => throws validation error', () => {
      expect(() => {
        return verifyQuestResultContract.parse({});
      }).toThrow(/Required/u);
    });

    it('INVALID_CHECKS: {checks with invalid item} => throws validation error', () => {
      expect(() => {
        return verifyQuestResultContract.parse({
          success: true,
          checks: [{ name: '', passed: true, details: 'test' }],
        });
      }).toThrow(/too_small/u);
    });
  });
});
