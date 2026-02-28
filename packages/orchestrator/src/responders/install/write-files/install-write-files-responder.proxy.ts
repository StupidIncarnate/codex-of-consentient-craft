import { pathJoinAdapterProxy, fsMkdirAdapterProxy } from '@dungeonmaster/shared/testing';
import { fsWriteFileAdapterProxy } from '../../../adapters/fs/write-file/fs-write-file-adapter.proxy';
import { InstallWriteFilesResponder } from './install-write-files-responder';

export const InstallWriteFilesResponderProxy = (): {
  callResponder: typeof InstallWriteFilesResponder;
  getWrittenFiles: () => readonly { path: unknown; content: unknown }[];
  getCreatedDirs: () => readonly unknown[];
} => {
  pathJoinAdapterProxy();
  const mkdirProxy = fsMkdirAdapterProxy();
  const writeFileProxy = fsWriteFileAdapterProxy();

  return {
    callResponder: InstallWriteFilesResponder,

    getWrittenFiles: (): readonly { path: unknown; content: unknown }[] =>
      writeFileProxy.getAllWrittenFiles(),

    getCreatedDirs: (): readonly unknown[] => mkdirProxy.getCreatedDirs(),
  };
};
