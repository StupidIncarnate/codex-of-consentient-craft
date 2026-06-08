import { pathJoinAdapterProxy, fsExistsSyncAdapterProxy } from '@dungeonmaster/shared/testing';
import { fsWriteFileAdapterProxy } from '../../../adapters/fs/write-file/fs-write-file-adapter.proxy';
import { InstallCreatePlaywrightResponder } from './install-create-playwright-responder';

export const InstallCreatePlaywrightResponderProxy = (): {
  callResponder: typeof InstallCreatePlaywrightResponder;
  setupFileExists: () => void;
  setupFileNotExists: () => void;
  getWrittenFiles: () => readonly { path: unknown; content: unknown }[];
} => {
  pathJoinAdapterProxy();
  const existsProxy = fsExistsSyncAdapterProxy();
  const writeProxy = fsWriteFileAdapterProxy();

  return {
    callResponder: InstallCreatePlaywrightResponder,

    setupFileExists: (): void => {
      existsProxy.returns({ result: true });
    },

    setupFileNotExists: (): void => {
      existsProxy.returns({ result: false });
    },

    getWrittenFiles: (): readonly { path: unknown; content: unknown }[] =>
      writeProxy.getAllWrittenFiles(),
  };
};
