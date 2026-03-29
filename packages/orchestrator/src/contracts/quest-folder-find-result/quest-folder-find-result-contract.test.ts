import { FilePathStub, QuestStub } from '@dungeonmaster/shared/contracts';

import { questFolderFindResultContract } from './quest-folder-find-result-contract';
import {
  QuestFolderFindResultFoundStub as _QuestFolderFindResultFoundStub,
  QuestFolderFindResultNotFoundStub as _QuestFolderFindResultNotFoundStub,
} from './quest-folder-find-result.stub';

describe('questFolderFindResultContract', () => {
  describe('found result', () => {
    it('VALID: {found: true, folderPath, quest} => parses successfully', () => {
      const quest = QuestStub({ id: 'add-auth' });
      const result = questFolderFindResultContract.parse({
        found: true,
        folderPath: FilePathStub({ value: '/project/.dungeonmaster-quests/001-add-auth' }),
        quest,
      });

      expect(result).toStrictEqual({
        found: true,
        folderPath: '/project/.dungeonmaster-quests/001-add-auth',
        quest: expect.any(Object),
      });
    });
  });

  describe('not found result', () => {
    it('VALID: {found: false} => parses successfully', () => {
      const result = questFolderFindResultContract.parse({
        found: false,
        folderPath: undefined,
        quest: undefined,
      });

      expect(result).toStrictEqual({
        found: false,
        folderPath: undefined,
        quest: undefined,
      });
    });
  });

  describe('invalid input', () => {
    it('INVALID: {found: true without folderPath} => throws', () => {
      expect(() =>
        questFolderFindResultContract.parse({
          found: true,
          quest: QuestStub(),
        }),
      ).toThrow(/required/iu);
    });

    it('INVALID: {found: true without quest} => throws', () => {
      expect(() =>
        questFolderFindResultContract.parse({
          found: true,
          folderPath: FilePathStub({ value: '/path' }),
        }),
      ).toThrow(/required/iu);
    });
  });
});
