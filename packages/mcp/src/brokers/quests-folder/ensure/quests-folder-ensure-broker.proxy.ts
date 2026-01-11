/**
 * PURPOSE: Test proxy for questsFolderEnsureBroker - mocks fs adapters
 *
 * USAGE:
 * const proxy = questsFolderEnsureBrokerProxy();
 * proxy.setupFolderExists();
 */

import { fsMkdirAdapterProxy } from '../../../adapters/fs/mkdir/fs-mkdir-adapter.proxy';
import { pathJoinAdapterProxy } from '../../../adapters/path/join/path-join-adapter.proxy';
import { FilePathStub } from '../../../contracts/file-path/file-path.stub';

export const questsFolderEnsureBrokerProxy = (): {
  setupFolderExists: () => void;
} => {
  const mkdirProxy = fsMkdirAdapterProxy();
  const pathJoinProxy = pathJoinAdapterProxy();

  // Setup path join to return expected path
  const questsBasePath = FilePathStub({ value: '/project/.dungeonmaster-quests' });

  pathJoinProxy.returns({ paths: [], result: questsBasePath });

  return {
    setupFolderExists: (): void => {
      mkdirProxy.succeeds({ filepath: questsBasePath });
    },
  };
};
