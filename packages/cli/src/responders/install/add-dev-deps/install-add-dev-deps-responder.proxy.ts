import { pathJoinAdapterProxy, fsExistsSyncAdapterProxy } from '@dungeonmaster/shared/testing';
import { fsReadFileAdapterProxy } from '../../../adapters/fs/read-file/fs-read-file-adapter.proxy';
import { fsWriteFileAdapterProxy } from '../../../adapters/fs/write-file/fs-write-file-adapter.proxy';
import { InstallAddDevDepsResponder } from './install-add-dev-deps-responder';

export const InstallAddDevDepsResponderProxy = (): {
  callResponder: typeof InstallAddDevDepsResponder;
  setupFileExists: () => void;
  setupFileNotExists: () => void;
  setupReadFile: (params: { content: string }) => void;
  getWrittenFiles: () => readonly { path: unknown; content: unknown }[];
} => {
  pathJoinAdapterProxy();
  const existsProxy = fsExistsSyncAdapterProxy();
  const readProxy = fsReadFileAdapterProxy();
  const writeProxy = fsWriteFileAdapterProxy();

  return {
    callResponder: InstallAddDevDepsResponder,

    setupFileExists: (): void => {
      existsProxy.returns({ result: true });
    },

    setupFileNotExists: (): void => {
      existsProxy.returns({ result: false });
    },

    setupReadFile: ({ content }: { content: string }): void => {
      readProxy.resolves({ content });
    },

    getWrittenFiles: (): readonly { path: unknown; content: unknown }[] =>
      writeProxy.getAllWrittenFiles(),
  };
};
