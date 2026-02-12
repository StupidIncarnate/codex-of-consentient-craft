import { questVerifyResultContract } from './quest-verify-result-contract';
import { QuestVerifyResultStub } from './quest-verify-result.stub';
import { QuestVerifyCheckStub } from '../quest-verify-check/quest-verify-check.stub';

describe('questVerifyResultContract', () => {
  describe('valid results', () => {
    it('VALID: {success: true, checks} => parses successfully', () => {
      const result = QuestVerifyResultStub();

      const parsed = questVerifyResultContract.parse(result);

      expect(parsed).toStrictEqual({
        success: true,
        checks: [
          {
            name: 'dependency-graph',
            passed: true,
          },
        ],
      });
    });

    it('VALID: {success: false, checks with message} => parses with failure', () => {
      const result = QuestVerifyResultStub({
        success: false,
        checks: [
          QuestVerifyCheckStub({
            name: 'observable-coverage' as never,
            passed: false,
            message: 'Missing coverage' as never,
          }),
        ],
      });

      const parsed = questVerifyResultContract.parse(result);

      expect(parsed).toStrictEqual({
        success: false,
        checks: [
          {
            name: 'observable-coverage',
            passed: false,
            message: 'Missing coverage',
          },
        ],
      });
    });

    it('EMPTY: {success: true, empty checks} => parses with no checks', () => {
      const result = QuestVerifyResultStub({ checks: [] });

      const parsed = questVerifyResultContract.parse(result);

      expect(parsed).toStrictEqual({
        success: true,
        checks: [],
      });
    });
  });

  describe('invalid results', () => {
    it('INVALID_SUCCESS: {missing success} => throws validation error', () => {
      expect(() => {
        questVerifyResultContract.parse({ checks: [] });
      }).toThrow(/Required/u);
    });

    it('INVALID_CHECKS: {missing checks} => throws validation error', () => {
      expect(() => {
        questVerifyResultContract.parse({ success: true });
      }).toThrow(/Required/u);
    });
  });
});
