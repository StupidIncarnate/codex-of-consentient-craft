import { verifyQuestResultContract } from './verify-quest-result-contract';
import { VerifyQuestResultStub } from './verify-quest-result.stub';

describe('verifyQuestResultContract', () => {
  describe('valid results', () => {
    it('VALID: {success: true, checks: []} => parses successfully', () => {
      const result = VerifyQuestResultStub();

      const parsed = verifyQuestResultContract.parse(result);

      expect(parsed).toStrictEqual({ success: true, checks: [] });
    });

    it('VALID: {success: true, checks with passing check} => parses successfully', () => {
      const result = VerifyQuestResultStub({
        success: true,
        checks: [
          { name: 'Observable Coverage', passed: true, details: 'All 3 observables covered' },
        ],
      });

      const parsed = verifyQuestResultContract.parse(result);

      expect(parsed).toStrictEqual({
        success: true,
        checks: [
          { name: 'Observable Coverage', passed: true, details: 'All 3 observables covered' },
        ],
      });
    });

    it('VALID: {success: false, checks with failing check} => parses successfully', () => {
      const result = VerifyQuestResultStub({
        success: false,
        checks: [
          {
            name: 'Dependency Integrity',
            passed: false,
            details: 'Step step-1 depends on non-existent step step-99',
          },
        ],
      });

      const parsed = verifyQuestResultContract.parse(result);

      expect(parsed).toStrictEqual({
        success: false,
        checks: [
          {
            name: 'Dependency Integrity',
            passed: false,
            details: 'Step step-1 depends on non-existent step step-99',
          },
        ],
      });
    });

    it('VALID: {success: false, error present} => parses with error', () => {
      const result = VerifyQuestResultStub({
        success: false,
        checks: [],
        error: 'Quest not found: nonexistent',
      });

      const parsed = verifyQuestResultContract.parse(result);

      expect(parsed).toStrictEqual({
        success: false,
        checks: [],
        error: 'Quest not found: nonexistent',
      });
    });

    it('VALID: {multiple checks mixed pass/fail} => parses successfully', () => {
      const result = VerifyQuestResultStub({
        success: false,
        checks: [
          { name: 'Observable Coverage', passed: true, details: 'All observables covered' },
          {
            name: 'No Orphan Steps',
            passed: false,
            details: 'Step step-2 has empty observablesSatisfied',
          },
        ],
      });

      const parsed = verifyQuestResultContract.parse(result);

      expect(parsed).toStrictEqual({
        success: false,
        checks: [
          { name: 'Observable Coverage', passed: true, details: 'All observables covered' },
          {
            name: 'No Orphan Steps',
            passed: false,
            details: 'Step step-2 has empty observablesSatisfied',
          },
        ],
      });
    });
  });

  describe('invalid results', () => {
    it('INVALID_MULTIPLE: {missing success and checks} => throws validation error', () => {
      expect(() => {
        return verifyQuestResultContract.parse({});
      }).toThrow(/Required/u);
    });

    it('INVALID_CHECK: {check missing name} => throws validation error', () => {
      expect(() => {
        return verifyQuestResultContract.parse({
          success: true,
          checks: [{ passed: true, details: 'ok' }],
        });
      }).toThrow(/Required/u);
    });
  });
});
