import { questsFolderEnsureBroker } from './quests-folder-ensure-broker';
import { questsFolderEnsureBrokerProxy } from './quests-folder-ensure-broker.proxy';
import { FilePathStub } from '../../../contracts/file-path/file-path.stub';

describe('questsFolderEnsureBroker', () => {
  describe('successful ensure', () => {
    it('VALID: {startPath: "/project/src/file.ts"} => creates folder and returns path', async () => {
      const { findProxy, mkdirProxy } = questsFolderEnsureBrokerProxy();
      const startPath = FilePathStub({ value: '/project/src/file.ts' });
      const questsPath = FilePathStub({ value: '/project/.dungeonmaster-quests' });

      findProxy.projectRootProxy.setupProjectRootFound({
        startPath: '/project/src/file.ts',
        projectRootPath: '/project',
      });
      findProxy.pathJoinProxy.returns({ result: questsPath });
      mkdirProxy.succeeds({ filepath: questsPath });

      const result = await questsFolderEnsureBroker({ startPath });

      expect(result).toStrictEqual({ questsBasePath: '/project/.dungeonmaster-quests' });
    });

    it('VALID: {startPath: "/deep/nested/project/file.ts"} => finds and ensures quests folder at project root', async () => {
      const { findProxy, mkdirProxy } = questsFolderEnsureBrokerProxy();
      const startPath = FilePathStub({ value: '/deep/nested/project/file.ts' });
      const questsPath = FilePathStub({ value: '/deep/nested/project/.dungeonmaster-quests' });

      findProxy.projectRootProxy.setupProjectRootFound({
        startPath: '/deep/nested/project/file.ts',
        projectRootPath: '/deep/nested/project',
      });
      findProxy.pathJoinProxy.returns({ result: questsPath });
      mkdirProxy.succeeds({ filepath: questsPath });

      const result = await questsFolderEnsureBroker({ startPath });

      expect(result).toStrictEqual({
        questsBasePath: '/deep/nested/project/.dungeonmaster-quests',
      });
    });
  });

  describe('error cases', () => {
    it('ERROR: {mkdir fails} => throws permission error', async () => {
      const { findProxy, mkdirProxy } = questsFolderEnsureBrokerProxy();
      const startPath = FilePathStub({ value: '/project/src/file.ts' });
      const questsPath = FilePathStub({ value: '/project/.dungeonmaster-quests' });

      findProxy.projectRootProxy.setupProjectRootFound({
        startPath: '/project/src/file.ts',
        projectRootPath: '/project',
      });
      findProxy.pathJoinProxy.returns({ result: questsPath });
      mkdirProxy.throws({ filepath: questsPath, error: new Error('Permission denied') });

      await expect(questsFolderEnsureBroker({ startPath })).rejects.toThrow('Permission denied');
    });
  });
});
