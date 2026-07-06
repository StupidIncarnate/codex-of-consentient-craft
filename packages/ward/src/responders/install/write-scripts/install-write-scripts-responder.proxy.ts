import { fsExistsSyncAdapterProxy } from '@dungeonmaster/shared/testing';
import { fsReadFileAdapterProxy } from '../../../adapters/fs/read-file/fs-read-file-adapter.proxy';
import { fsWriteFileAdapterProxy } from '../../../adapters/fs/write-file/fs-write-file-adapter.proxy';
import { InstallWriteScriptsResponder } from './install-write-scripts-responder';

export const InstallWriteScriptsResponderProxy = (): {
  callResponder: typeof InstallWriteScriptsResponder;
  setupFileExists: () => void;
  setupFileNotExists: () => void;
  setupReadFileContent: (params: { content: string }) => void;
  getWrittenContent: () => unknown;
  getWrittenPath: () => unknown;
} => {
  const existsProxy = fsExistsSyncAdapterProxy();
  const readProxy = fsReadFileAdapterProxy();
  const writeProxy = fsWriteFileAdapterProxy();

  return {
    callResponder: InstallWriteScriptsResponder,

    setupFileExists: (): void => {
      existsProxy.returns({ result: true });
    },

    setupFileNotExists: (): void => {
      existsProxy.returns({ result: false });
    },

    setupReadFileContent: ({ content }: { content: string }): void => {
      readProxy.returns({ content });
    },

    getWrittenContent: (): unknown => writeProxy.getWrittenContent(),

    getWrittenPath: (): unknown => writeProxy.getWrittenPath(),
  };
};
