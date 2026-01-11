/**
 * PURPOSE: Proxy for quest-add-broker that mocks filesystem and path operations
 *
 * USAGE:
 * const brokerProxy = questAddBrokerProxy();
 * brokerProxy.setupQuestCreation({ questsPath, existingFolders, questFolderPath, questFilePath });
 * // Sets up mocks for quest creation
 */

import { fsWriteFileAdapterProxy } from '../../../adapters/fs/write-file/fs-write-file-adapter.proxy';
import { fsMkdirAdapterProxy } from '../../../adapters/fs/mkdir/fs-mkdir-adapter.proxy';
import { fsReaddirAdapterProxy } from '../../../adapters/fs/readdir/fs-readdir-adapter.proxy';
import { pathJoinAdapterProxy } from '../../../adapters/path/join/path-join-adapter.proxy';
import type { FilePathStub } from '../../../contracts/file-path/file-path.stub';
import type { FolderNameStub } from '../../../contracts/folder-name/folder-name.stub';
import type { FileContentsStub } from '../../../contracts/file-contents/file-contents.stub';

type FilePath = ReturnType<typeof FilePathStub>;
type FolderName = ReturnType<typeof FolderNameStub>;
type FileContents = ReturnType<typeof FileContentsStub>;

export const questAddBrokerProxy = (): {
  setupQuestCreation: (params: {
    questsPath: FilePath;
    existingFolders: FolderName[];
    questFolderPath: FilePath;
    questFilePath: FilePath;
  }) => void;
  setupQuestCreationFailure: (params: { questsPath: FilePath; error: Error }) => void;
} => {
  const mkdirProxy = fsMkdirAdapterProxy();
  const readdirProxy = fsReaddirAdapterProxy();
  const writeFileProxy = fsWriteFileAdapterProxy();
  const pathJoinProxy = pathJoinAdapterProxy();

  return {
    setupQuestCreation: ({
      questsPath,
      existingFolders,
      questFolderPath,
      questFilePath,
    }: {
      questsPath: FilePath;
      existingFolders: FolderName[];
      questFolderPath: FilePath;
      questFilePath: FilePath;
    }): void => {
      // Mock path joins (3 calls: questsPath, questFolderPath, questFilePath)
      pathJoinProxy.returns({ paths: [], result: questsPath });
      pathJoinProxy.returns({ paths: [], result: questFolderPath });
      pathJoinProxy.returns({ paths: [], result: questFilePath });

      // Mock directory operations
      mkdirProxy.succeeds({ filepath: questsPath });
      readdirProxy.returns({ filepath: questsPath, entries: existingFolders });
      mkdirProxy.succeeds({ filepath: questFolderPath });

      // Mock file write
      writeFileProxy.succeeds({ filepath: questFilePath, contents: '' as FileContents });
    },

    setupQuestCreationFailure: ({
      questsPath,
      error,
    }: {
      questsPath: FilePath;
      error: Error;
    }): void => {
      // Mock path join
      pathJoinProxy.returns({ paths: [], result: questsPath });

      // Mock mkdir to throw error
      mkdirProxy.throws({ filepath: questsPath, error });
    },
  };
};
