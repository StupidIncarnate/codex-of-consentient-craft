import { fsMkdirAdapterProxy, pathJoinAdapterProxy } from '@dungeonmaster/shared/testing';
import { fsWriteFileAdapterProxy } from '../../../adapters/fs/write-file/fs-write-file-adapter.proxy';
import { InstallCommandsCreateResponder } from './install-commands-create-responder';

export const InstallCommandsCreateResponderProxy = (): {
  callResponder: typeof InstallCommandsCreateResponder;
  getCreatedDirs: () => readonly unknown[];
  getAllWrittenFiles: () => readonly { path: unknown; content: unknown }[];
} => {
  pathJoinAdapterProxy();
  const mkdirProxy = fsMkdirAdapterProxy();
  const writeProxy = fsWriteFileAdapterProxy();

  return {
    callResponder: InstallCommandsCreateResponder,
    getCreatedDirs: (): readonly unknown[] => mkdirProxy.getCreatedDirs(),
    getAllWrittenFiles: (): readonly { path: unknown; content: unknown }[] =>
      writeProxy.getAllWrittenFiles(),
  };
};
