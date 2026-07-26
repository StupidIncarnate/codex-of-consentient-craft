import { pathJoinAdapterProxy, fsExistsSyncAdapterProxy } from '@dungeonmaster/shared/testing';
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
  pathJoinAdapterProxy();
  const existsProxy = fsExistsSyncAdapterProxy();
  const readProxy = fsReadFileAdapterProxy();
  const writeProxy = fsWriteFileAdapterProxy();

  return {
    callResponder: InstallAddDevDepsResponder,

    setupFileExists: ({ filePath }: { filePath: FilePath }): void => {
      existsProxy.returns({ filePath, result: true });
    },

    setupFileNotExists: ({ filePath }: { filePath: FilePath }): void => {
      existsProxy.returns({ filePath, result: false });
    },

    setupReadFile: ({ filePath, content }: { filePath: FilePath; content: string }): void => {
      readProxy.resolves({ filePath, content });
      writeProxy.succeeds({ filePath });
    },

    getWrittenFiles: (): readonly { path: unknown; content: unknown }[] =>
      writeProxy.getAllWrittenFiles(),
  };
};
