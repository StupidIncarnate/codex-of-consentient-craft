import { join } from '#gateway/node/path';
import { existsSyncProxy } from '#gateway/node/fs/exists-sync/exists-sync.proxy';
import { registerMock, requireActual } from '@dungeonmaster/testing/register-mock';
import type { FilePath } from '@dungeonmaster/shared/contracts';
import { fsReadFileAdapterProxy } from '../../../adapters/fs/read-file/fs-read-file-adapter.proxy';
import { fsWriteFileAdapterProxy } from '../../../adapters/fs/write-file/fs-write-file-adapter.proxy';
import { InstallAddDevDepsResponder } from './install-add-dev-deps-responder';

export const InstallAddDevDepsResponderProxy = (): {
  callResponder: typeof InstallAddDevDepsResponder;
  setupFileExists: (params: { filePath: FilePath }) => void;
  setupFileNotExists: (params: { filePath: FilePath }) => void;
  setupReadFile: (params: { filePath: FilePath; content: string }) => void;
  getWrittenFiles: () => readonly { path: unknown; content: unknown }[];
} => {
  const existsProxy = existsSyncProxy();
  const readProxy = fsReadFileAdapterProxy();
  const writeProxy = fsWriteFileAdapterProxy();
  const realPath = requireActual<{ join: typeof join }>({ module: 'path' });
  const joinHandle = registerMock({ fn: join });
  joinHandle.calledWith([]).implement((...segments: never[]) => realPath.join(...segments));

  return {
    callResponder: InstallAddDevDepsResponder,

    setupFileExists: ({ filePath }: { filePath: FilePath }): void => {
      existsProxy.returns({ path: filePath, exists: true });
    },

    setupFileNotExists: ({ filePath }: { filePath: FilePath }): void => {
      existsProxy.returns({ path: filePath, exists: false });
    },

    setupReadFile: ({ filePath, content }: { filePath: FilePath; content: string }): void => {
      readProxy.resolves({ filePath, content });
      writeProxy.succeeds({ filePath });
    },

    getWrittenFiles: (): readonly { path: unknown; content: unknown }[] =>
      writeProxy.getAllWrittenFiles(),
  };
};
