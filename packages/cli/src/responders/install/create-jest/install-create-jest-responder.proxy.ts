import { pathJoinAdapterProxy, fsExistsSyncAdapterProxy } from '@dungeonmaster/shared/testing';
import { fsWriteFileAdapterProxy } from '../../../adapters/fs/write-file/fs-write-file-adapter.proxy';
import { InstallCreateJestResponder } from './install-create-jest-responder';

export const InstallCreateJestResponderProxy = (): {
  callResponder: typeof InstallCreateJestResponder;
  setupFileExists: () => void;
  setupFileNotExists: () => void;
  getWrittenFiles: () => readonly { path: unknown; content: unknown }[];
} => {
  pathJoinAdapterProxy();
  const existsProxy = fsExistsSyncAdapterProxy();
  const writeProxy = fsWriteFileAdapterProxy();

  return {
    callResponder: InstallCreateJestResponder,

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
