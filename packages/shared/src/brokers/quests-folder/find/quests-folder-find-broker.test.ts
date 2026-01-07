import { questsFolderFindBroker } from './quests-folder-find-broker';
import { questsFolderFindBrokerProxy } from './quests-folder-find-broker.proxy';
import { FilePathStub } from '../../../contracts/file-path/file-path.stub';

describe('questsFolderFindBroker', () => {
  describe('quests folder found cases', () => {
    it('VALID: {startPath: "/project/src/file.ts"} => returns path to .dungeonmaster-quests folder', async () => {
      const { projectRootProxy, pathJoinProxy } = questsFolderFindBrokerProxy();
      const startPath = FilePathStub({ value: '/project/src/file.ts' });

      projectRootProxy.setupProjectRootFound({
        startPath: '/project/src/file.ts',
        projectRootPath: '/project',
      });
      pathJoinProxy.returns({ result: FilePathStub({ value: '/project/.dungeonmaster-quests' }) });

      const result = await questsFolderFindBroker({ startPath });

      expect(result).toBe('/project/.dungeonmaster-quests');
    });

    it('VALID: {startPath: "/deep/nested/project/file.ts"} => finds quests folder at project root', async () => {
      const { projectRootProxy, pathJoinProxy } = questsFolderFindBrokerProxy();
      const startPath = FilePathStub({ value: '/deep/nested/project/file.ts' });

      projectRootProxy.setupProjectRootFound({
        startPath: '/deep/nested/project/file.ts',
        projectRootPath: '/deep/nested/project',
      });
      pathJoinProxy.returns({
        result: FilePathStub({ value: '/deep/nested/project/.dungeonmaster-quests' }),
      });

      const result = await questsFolderFindBroker({ startPath });

      expect(result).toBe('/deep/nested/project/.dungeonmaster-quests');
    });
  });

  describe('edge cases', () => {
    it('EDGE: {startPath: "/project/.hidden"} => handles hidden files as start path', async () => {
      const { projectRootProxy, pathJoinProxy } = questsFolderFindBrokerProxy();
      const startPath = FilePathStub({ value: '/project/.hidden' });

      projectRootProxy.setupProjectRootFound({
        startPath: '/project/.hidden',
        projectRootPath: '/project',
      });
      pathJoinProxy.returns({ result: FilePathStub({ value: '/project/.dungeonmaster-quests' }) });

      const result = await questsFolderFindBroker({ startPath });

      expect(result).toBe('/project/.dungeonmaster-quests');
    });

    it('EDGE: {startPath: "/path with spaces/file.ts"} => handles paths with spaces', async () => {
      const { projectRootProxy, pathJoinProxy } = questsFolderFindBrokerProxy();
      const startPath = FilePathStub({ value: '/path with spaces/file.ts' });

      projectRootProxy.setupProjectRootFound({
        startPath: '/path with spaces/file.ts',
        projectRootPath: '/path with spaces',
      });
      pathJoinProxy.returns({
        result: FilePathStub({ value: '/path with spaces/.dungeonmaster-quests' }),
      });

      const result = await questsFolderFindBroker({ startPath });

      expect(result).toBe('/path with spaces/.dungeonmaster-quests');
    });
  });
});
