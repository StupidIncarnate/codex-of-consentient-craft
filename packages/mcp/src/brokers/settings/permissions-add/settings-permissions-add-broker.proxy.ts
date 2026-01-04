import { fsReadFileAdapterProxy } from '../../../adapters/fs/read-file/fs-read-file-adapter.proxy';
import { fsWriteFileAdapterProxy } from '../../../adapters/fs/write-file/fs-write-file-adapter.proxy';
import { fsMkdirAdapterProxy } from '../../../adapters/fs/mkdir/fs-mkdir-adapter.proxy';
import { pathJoinAdapterProxy } from '../../../adapters/path/join/path-join-adapter.proxy';
import { FilePathStub } from '../../../contracts/file-path/file-path.stub';
import { FileContentsStub } from '../../../contracts/file-contents/file-contents.stub';

type FilePath = ReturnType<typeof FilePathStub>;
type FileContents = ReturnType<typeof FileContentsStub>;

export const settingsPermissionsAddBrokerProxy = (): {
  setupExistingSettings: ({
    settingsPath,
    contents,
  }: {
    settingsPath: FilePath;
    contents: FileContents;
  }) => void;
  setupNoExistingSettings: ({ settingsPath }: { settingsPath: FilePath }) => void;
  setupWriteSuccess: ({
    settingsPath,
    contents,
  }: {
    settingsPath: FilePath;
    contents: FileContents;
  }) => void;
} => {
  const readProxy = fsReadFileAdapterProxy();
  const writeProxy = fsWriteFileAdapterProxy();
  const mkdirProxy = fsMkdirAdapterProxy();
  pathJoinAdapterProxy();

  return {
    setupExistingSettings: ({
      settingsPath,
      contents,
    }: {
      settingsPath: FilePath;
      contents: FileContents;
    }): void => {
      mkdirProxy.succeeds({ filepath: FilePathStub() });
      readProxy.returns({ filepath: settingsPath, contents });
      writeProxy.succeeds({ filepath: settingsPath, contents: FileContentsStub() });
    },
    setupNoExistingSettings: ({ settingsPath }: { settingsPath: FilePath }): void => {
      mkdirProxy.succeeds({ filepath: FilePathStub() });
      readProxy.throws({ filepath: settingsPath, error: new Error('ENOENT') });
      writeProxy.succeeds({ filepath: settingsPath, contents: FileContentsStub() });
    },
    setupWriteSuccess: ({
      settingsPath,
      contents,
    }: {
      settingsPath: FilePath;
      contents: FileContents;
    }): void => {
      mkdirProxy.succeeds({ filepath: FilePathStub() });
      readProxy.returns({ filepath: settingsPath, contents });
      writeProxy.succeeds({ filepath: settingsPath, contents: FileContentsStub() });
    },
  };
};
