/**
 * PURPOSE: Test proxy for questsFolderEnsureBroker - mocks fs adapters
 *
 * USAGE:
 * const proxy = questsFolderEnsureBrokerProxy();
 * proxy.setupFolderAndDbExist();
 */

import { fsMkdirAdapterProxy } from '../../../adapters/fs/mkdir/fs-mkdir-adapter.proxy';
import { fsReadFileAdapterProxy } from '../../../adapters/fs/read-file/fs-read-file-adapter.proxy';
import { fsWriteFileAdapterProxy } from '../../../adapters/fs/write-file/fs-write-file-adapter.proxy';
import { pathJoinAdapterProxy } from '../../../adapters/path/join/path-join-adapter.proxy';
import { FilePathStub } from '../../../contracts/file-path/file-path.stub';
import { FileContentsStub } from '../../../contracts/file-contents/file-contents.stub';

export const questsFolderEnsureBrokerProxy = (): {
  setupFolderAndDbExist: () => void;
  setupFolderExistsDbDoesNot: () => void;
} => {
  const mkdirProxy = fsMkdirAdapterProxy();
  const readFileProxy = fsReadFileAdapterProxy();
  const writeFileProxy = fsWriteFileAdapterProxy();
  const pathJoinProxy = pathJoinAdapterProxy();

  // Setup path joins to return expected paths
  const questsBasePath = FilePathStub({ value: '/project/.dungeonmaster-quests' });
  const dbPath = FilePathStub({ value: '/project/.dungeonmaster-quests/db.json' });

  pathJoinProxy.returns({ paths: [], result: questsBasePath });
  pathJoinProxy.returns({ paths: [], result: dbPath });

  return {
    setupFolderAndDbExist: (): void => {
      mkdirProxy.succeeds({ filepath: questsBasePath });
      readFileProxy.returns({
        filepath: dbPath,
        contents: FileContentsStub({ value: '{"quests":[]}' }),
      });
    },

    setupFolderExistsDbDoesNot: (): void => {
      mkdirProxy.succeeds({ filepath: questsBasePath });
      readFileProxy.throws({
        filepath: dbPath,
        error: new Error('ENOENT: no such file or directory'),
      });
      writeFileProxy.succeeds({
        filepath: dbPath,
        contents: FileContentsStub({ value: '{"quests":[]}' }),
      });
    },
  };
};
