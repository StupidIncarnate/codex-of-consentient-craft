import { verifyQuestCheckContract } from './verify-quest-check-contract';
import { VerifyQuestCheckStub } from './verify-quest-check.stub';

describe('verifyQuestCheckContract', () => {
  describe('valid checks', () => {
    it('VALID: {name, passed: true, details} => parses successfully', () => {
      const check = VerifyQuestCheckStub();

      const result = verifyQuestCheckContract.parse(check);

      expect(result).toStrictEqual({
        name: 'Test Check',
        passed: true,
        details: 'All checks passed',
      });
    });

    it('VALID: {passed: false with details} => parses failing check', () => {
      const check = VerifyQuestCheckStub({
        name: 'Observable Coverage',
        passed: false,
        details: 'Missing coverage for obs-1',
      });

      const result = verifyQuestCheckContract.parse(check);

      expect(result).toStrictEqual({
        name: 'Observable Coverage',
        passed: false,
        details: 'Missing coverage for obs-1',
      });
    });
  });

  describe('invalid checks', () => {
    it('INVALID_NAME: {name: ""} => throws validation error', () => {
      expect(() => {
        return verifyQuestCheckContract.parse({ name: '', passed: true, details: 'ok' });
      }).toThrow(/too_small/u);
    });

    it('INVALID_MULTIPLE: {missing all fields} => throws validation error', () => {
      expect(() => {
        return verifyQuestCheckContract.parse({});
      }).toThrow(/Required/u);
    });
  });
});
