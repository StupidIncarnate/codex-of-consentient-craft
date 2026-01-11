import { QuestStub } from '@dungeonmaster/shared/contracts';

import { FilePathStub } from '../file-path/file-path.stub';
import { questFolderFindResultContract } from './quest-folder-find-result-contract';

describe('questFolderFindResultContract', () => {
  describe('found result', () => {
    it('VALID: {found: true, folderPath, quest} => parses successfully', () => {
      const quest = QuestStub({ id: 'add-auth' });
      const result = questFolderFindResultContract.parse({
        found: true,
        folderPath: FilePathStub({ value: '/project/.dungeonmaster-quests/001-add-auth' }),
        quest,
      });

      expect(result.found).toBe(true);
      expect(result.folderPath).toBe('/project/.dungeonmaster-quests/001-add-auth');
      expect(result.quest?.id).toBe('add-auth');
    });
  });

  describe('not found result', () => {
    it('VALID: {found: false} => parses successfully', () => {
      const result = questFolderFindResultContract.parse({
        found: false,
        folderPath: undefined,
        quest: undefined,
      });

      expect(result.found).toBe(false);
      expect(result.folderPath).toBeUndefined();
      expect(result.quest).toBeUndefined();
    });
  });

  describe('invalid input', () => {
    it('INVALID_FOUND: {found: true without folderPath} => throws', () => {
      expect(() =>
        questFolderFindResultContract.parse({
          found: true,
          quest: QuestStub(),
        }),
      ).toThrow(/required/iu);
    });

    it('INVALID_FOUND: {found: true without quest} => throws', () => {
      expect(() =>
        questFolderFindResultContract.parse({
          found: true,
          folderPath: FilePathStub({ value: '/path' }),
        }),
      ).toThrow(/required/iu);
    });
  });
});
