import { QuestFindQuestPathResultStub } from './quest-find-quest-path-result.stub';
import { questFindQuestPathResultContract } from './quest-find-quest-path-result-contract';

describe('questFindQuestPathResultContract', () => {
  describe('valid inputs', () => {
    it('VALID: {stub} => parses successfully', () => {
      const stub = QuestFindQuestPathResultStub();

      expect(questFindQuestPathResultContract.parse(stub)).toStrictEqual(stub);
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {questPath: wrong type} => throws', () => {
      expect(() =>
        questFindQuestPathResultContract.parse({
          ...QuestFindQuestPathResultStub(),
          questPath: 123,
        }),
      ).toThrow(/expected|invalid/iu);
    });
  });
});
