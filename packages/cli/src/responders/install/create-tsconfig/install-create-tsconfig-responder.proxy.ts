import { pathJoinAdapterProxy, fsExistsSyncAdapterProxy } from '@dungeonmaster/shared/testing';
import { fsWriteFileAdapterProxy } from '../../../adapters/fs/write-file/fs-write-file-adapter.proxy';
import { InstallCreateTsconfigResponder } from './install-create-tsconfig-responder';

export const InstallCreateTsconfigResponderProxy = (): {
  callResponder: typeof InstallCreateTsconfigResponder;
  setupFileExists: () => void;
  setupFileNotExists: () => void;
  getWrittenFiles: () => readonly { path: unknown; content: unknown }[];
} => {
  pathJoinAdapterProxy();
  const existsProxy = fsExistsSyncAdapterProxy();
  const writeProxy = fsWriteFileAdapterProxy();

  return {
    callResponder: InstallCreateTsconfigResponder,

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
