import { questsFolderStatics } from './quests-folder-statics';

describe('questsFolderStatics', () => {
  describe('paths', () => {
    it('VALID: root => returns quests folder name', () => {
      expect(questsFolderStatics.paths.root).toBe('.dungeonmaster-quests');
    });

    it('VALID: closed => returns closed subfolder name', () => {
      expect(questsFolderStatics.paths.closed).toBe('closed');
    });
  });

  describe('files', () => {
    it('VALID: extension => returns .json', () => {
      expect(questsFolderStatics.files.extension).toBe('.json');
    });

    it('VALID: packageJson => returns package.json', () => {
      expect(questsFolderStatics.files.packageJson).toBe('package.json');
    });
  });
});
