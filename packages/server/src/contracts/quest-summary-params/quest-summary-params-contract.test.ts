import { questSummaryParamsContract } from './quest-summary-params-contract';
import { QuestSummaryParamsStub } from './quest-summary-params.stub';

describe('questSummaryParamsContract', () => {
  describe('valid input', () => {
    it('VALID: {questId} => parses the branded questId', () => {
      const result = QuestSummaryParamsStub();

      expect(result).toStrictEqual({ questId: '11111111-1111-4111-8111-111111111111' });
    });

    it('VALID: {questId is a slug rather than a uuid} => parses, because a quest id is any non-empty string', () => {
      expect(questSummaryParamsContract.parse({ questId: 'add-auth' })).toStrictEqual({
        questId: 'add-auth',
      });
    });
  });

  describe('invalid input', () => {
    it('EMPTY: {questId: ""} => throws', () => {
      expect(() => questSummaryParamsContract.parse({ questId: '' })).toThrow(
        /at least 1 character/u,
      );
    });

    it('INVALID: {missing questId} => throws', () => {
      expect(() => questSummaryParamsContract.parse({})).toThrow(/Required/u);
    });
  });
});
