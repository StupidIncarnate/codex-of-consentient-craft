import { questsFolderFindBroker } from './quests-folder-find-broker';
import { questsFolderFindBrokerProxy } from './quests-folder-find-broker.proxy';
import { FilePathStub } from '../../../contracts/file-path/file-path.stub';

describe('questsFolderFindBroker', () => {
  describe('quests folder found cases', () => {
    it('VALID: {startPath: "/project/src/file.ts"} => returns path to .dungeonmaster-quests folder', async () => {
      const proxy = questsFolderFindBrokerProxy();
      const startPath = FilePathStub({ value: '/project/src/file.ts' });

      proxy.setupQuestsFolderFound({
        startPath: '/project/src/file.ts',
        projectRootPath: '/project',
        questsFolderPath: FilePathStub({ value: '/project/.dungeonmaster-quests' }),
      });

      const result = await questsFolderFindBroker({ startPath });

      expect(result).toBe('/project/.dungeonmaster-quests');
    });

    it('VALID: {startPath: "/deep/nested/project/file.ts"} => finds quests folder at project root', async () => {
      const proxy = questsFolderFindBrokerProxy();
      const startPath = FilePathStub({ value: '/deep/nested/project/file.ts' });

      proxy.setupQuestsFolderFound({
        startPath: '/deep/nested/project/file.ts',
        projectRootPath: '/deep/nested/project',
        questsFolderPath: FilePathStub({ value: '/deep/nested/project/.dungeonmaster-quests' }),
      });

      const result = await questsFolderFindBroker({ startPath });

      expect(result).toBe('/deep/nested/project/.dungeonmaster-quests');
    });
  });

  describe('edge cases', () => {
    it('EDGE: {startPath: "/project/.hidden"} => handles hidden files as start path', async () => {
      const proxy = questsFolderFindBrokerProxy();
      const startPath = FilePathStub({ value: '/project/.hidden' });

      proxy.setupQuestsFolderFound({
        startPath: '/project/.hidden',
        projectRootPath: '/project',
        questsFolderPath: FilePathStub({ value: '/project/.dungeonmaster-quests' }),
      });

      const result = await questsFolderFindBroker({ startPath });

      expect(result).toBe('/project/.dungeonmaster-quests');
    });

    it('EDGE: {startPath: "/path with spaces/file.ts"} => handles paths with spaces', async () => {
      const proxy = questsFolderFindBrokerProxy();
      const startPath = FilePathStub({ value: '/path with spaces/file.ts' });

      proxy.setupQuestsFolderFound({
        startPath: '/path with spaces/file.ts',
        projectRootPath: '/path with spaces',
        questsFolderPath: FilePathStub({ value: '/path with spaces/.dungeonmaster-quests' }),
      });

      const result = await questsFolderFindBroker({ startPath });

      expect(result).toBe('/path with spaces/.dungeonmaster-quests');
    });
  });
});
