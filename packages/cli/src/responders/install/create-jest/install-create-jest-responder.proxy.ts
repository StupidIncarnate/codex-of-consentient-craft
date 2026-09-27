import { join } from '#gateway/node/path';
import { existsSyncProxy } from '#gateway/node/fs/exists-sync/exists-sync.proxy';
import { registerMock, requireActual } from '@dungeonmaster/testing/register-mock';
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
  const existsProxy = existsSyncProxy();
  const readProxy = fsReadFileAdapterProxy();
  const writeProxy = fsWriteFileAdapterProxy();
  const realPath = requireActual<{ join: typeof join }>({ module: 'path' });
  const joinHandle = registerMock({ fn: join });
  joinHandle.calledWith([]).implement((...segments: never[]) => realPath.join(...segments));

  const packageJsonPath = FilePathStub({ value: '/project/package.json' });

  const markSinglePackage = (): void => {
    existsProxy.returns({ path: packageJsonPath, exists: false });
  };

  return {
    callResponder: InstallCreateJestResponder,

    setupFileExists: ({ filePath }: { filePath: FilePath }): void => {
      markSinglePackage();
      existsProxy.returns({ path: filePath, exists: true });
    },

    setupFileNotExists: ({ filePath }: { filePath: FilePath }): void => {
      markSinglePackage();
      existsProxy.returns({ path: filePath, exists: false });
      writeProxy.succeeds({ filePath });
    },

    setupWorkspacesRoot: (): void => {
      existsProxy.returns({ path: packageJsonPath, exists: true });
      readProxy.resolves({
        filePath: packageJsonPath,
        content: JSON.stringify({ name: 'root', workspaces: ['packages/*'] }),
      });
    },

    getWrittenFiles: (): readonly { path: unknown; content: unknown }[] =>
      writeProxy.getAllWrittenFiles(),
  };
};
