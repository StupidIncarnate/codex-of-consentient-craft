import { pathJoinAdapterProxy, fsExistsSyncAdapterProxy } from '@dungeonmaster/shared/testing';
import { FilePathStub, type FilePath } from '@dungeonmaster/shared/contracts';
import { fsReadFileAdapterProxy } from '../../../adapters/fs/read-file/fs-read-file-adapter.proxy';
import { fsWriteFileAdapterProxy } from '../../../adapters/fs/write-file/fs-write-file-adapter.proxy';
import { InstallCreateJestResponder } from './install-create-jest-responder';

export const InstallCreateJestResponderProxy = (): {
  callResponder: typeof InstallCreateJestResponder;
  setupFileExists: (params: { filePath: FilePath }) => void;
  setupFileNotExists: (params: { filePath: FilePath }) => void;
  setupWorkspacesRoot: () => void;
  getWrittenFiles: () => readonly { path: unknown; content: unknown }[];
} => {
  pathJoinAdapterProxy();
  const existsProxy = fsExistsSyncAdapterProxy();
  const readProxy = fsReadFileAdapterProxy();
  const writeProxy = fsWriteFileAdapterProxy();

  const packageJsonPath = FilePathStub({ value: '/project/package.json' });

  const markSinglePackage = (): void => {
    existsProxy.returns({ filePath: packageJsonPath, result: false });
  };

  return {
    callResponder: InstallCreateJestResponder,

    setupFileExists: ({ filePath }: { filePath: FilePath }): void => {
      markSinglePackage();
      existsProxy.returns({ filePath, result: true });
    },

    setupFileNotExists: ({ filePath }: { filePath: FilePath }): void => {
      markSinglePackage();
      existsProxy.returns({ filePath, result: false });
      writeProxy.succeeds({ filePath });
    },

    setupWorkspacesRoot: (): void => {
      existsProxy.returns({ filePath: packageJsonPath, result: true });
      readProxy.resolves({
        filePath: packageJsonPath,
        content: JSON.stringify({ name: 'root', workspaces: ['packages/*'] }),
      });
    },

    getWrittenFiles: (): readonly { path: unknown; content: unknown }[] =>
      writeProxy.getAllWrittenFiles(),
  };
};
