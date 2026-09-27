import { questsFolderEnsureBroker } from './quests-folder-ensure-broker';
import { questsFolderEnsureBrokerProxy } from './quests-folder-ensure-broker.proxy';
import { FsErrorStub } from '#gateway/node/fs/is-fs-error/fs-error.stub';
import { FilePathStub } from '../../../contracts/file-path/file-path.stub';

describe('questsFolderEnsureBroker', () => {
  describe('successful ensure', () => {
    it('VALID: {startPath: "/project/src/file.ts"} => creates folder and returns path', async () => {
      const proxy = questsFolderEnsureBrokerProxy();
      const startPath = FilePathStub({ value: '/project/src/file.ts' });

      proxy.setupQuestsFolderEnsureSuccess({
        startPath: '/project/src/file.ts',
        projectRootPath: '/project',
        questsFolderPath: FilePathStub({ value: '/project/.dungeonmaster-quests' }),
      });

      const result = await questsFolderEnsureBroker({ startPath });

      expect(result).toStrictEqual({ questsBasePath: '/project/.dungeonmaster-quests' });
    });

    it('VALID: {startPath: "/deep/nested/project/file.ts"} => finds and ensures quests folder at project root', async () => {
      const proxy = questsFolderEnsureBrokerProxy();
      const startPath = FilePathStub({ value: '/deep/nested/project/file.ts' });

      proxy.setupQuestsFolderEnsureSuccess({
        startPath: '/deep/nested/project/file.ts',
        projectRootPath: '/deep/nested/project',
        questsFolderPath: FilePathStub({ value: '/deep/nested/project/.dungeonmaster-quests' }),
      });

      const result = await questsFolderEnsureBroker({ startPath });

      expect(result).toStrictEqual({
        questsBasePath: '/deep/nested/project/.dungeonmaster-quests',
      });
    });
  });

  describe('error cases', () => {
    it('ERROR: {mkdir fails} => throws permission error', async () => {
      const proxy = questsFolderEnsureBrokerProxy();
      const startPath = FilePathStub({ value: '/project/src/file.ts' });
      const error = FsErrorStub({ code: 'EACCES', path: '/project/.dungeonmaster-quests' });

      proxy.setupQuestsFolderMkdirFails({
        startPath: '/project/src/file.ts',
        projectRootPath: '/project',
        questsFolderPath: FilePathStub({ value: '/project/.dungeonmaster-quests' }),
        error,
      });

      await expect(questsFolderEnsureBroker({ startPath })).rejects.toBe(error);
    });
  });
});
