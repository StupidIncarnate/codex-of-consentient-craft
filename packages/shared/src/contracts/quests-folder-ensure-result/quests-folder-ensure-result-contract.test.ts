import { QuestsFolderEnsureResultStub } from './quests-folder-ensure-result.stub';
import { questsFolderEnsureResultContract } from './quests-folder-ensure-result-contract';

describe('questsFolderEnsureResultContract', () => {
  describe('valid inputs', () => {
    it('VALID: {stub} => parses successfully', () => {
      const stub = QuestsFolderEnsureResultStub();

      expect(questsFolderEnsureResultContract.parse(stub)).toStrictEqual(stub);
    });
  });

  describe('invalid inputs', () => {
    it('INVALID: {questsBasePath: wrong type} => throws', () => {
      expect(() =>
        questsFolderEnsureResultContract.parse({
          ...QuestsFolderEnsureResultStub(),
          questsBasePath: 123,
        }),
      ).toThrow(/expected|invalid/iu);
    });
  });
});
