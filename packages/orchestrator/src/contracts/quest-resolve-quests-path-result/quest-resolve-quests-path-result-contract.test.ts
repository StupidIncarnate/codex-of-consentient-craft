import { QuestResolveQuestsPathResultStub } from './quest-resolve-quests-path-result.stub';
import { questResolveQuestsPathResultContract } from './quest-resolve-quests-path-result-contract';

describe('questResolveQuestsPathResultContract', () => {
  describe('valid inputs', () => {
    it('VALID: {stub} => parses successfully', () => {
      const stub = QuestResolveQuestsPathResultStub();

      expect(questResolveQuestsPathResultContract.parse(stub)).toStrictEqual(stub);
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {questsPath: wrong type} => throws', () => {
      expect(() =>
        questResolveQuestsPathResultContract.parse({
          ...QuestResolveQuestsPathResultStub(),
          questsPath: 123,
        }),
      ).toThrow(/expected|invalid/iu);
    });
  });
});
