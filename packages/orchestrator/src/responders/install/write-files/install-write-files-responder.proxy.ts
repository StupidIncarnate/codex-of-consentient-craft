import { pathJoinAdapterProxy, fsMkdirAdapterProxy } from '@dungeonmaster/shared/testing';
import { fsWriteFileAdapterProxy } from '../../../adapters/fs/write-file/fs-write-file-adapter.proxy';
import { InstallWriteFilesResponder } from './install-write-files-responder';

export const InstallWriteFilesResponderProxy = (): {
  callResponder: typeof InstallWriteFilesResponder;
  getWrittenFiles: () => ReadonlyArray<{ path: unknown; content: unknown }>;
  getCreatedDirs: () => ReadonlyArray<unknown>;
} => {
  pathJoinAdapterProxy();
  const mkdirProxy = fsMkdirAdapterProxy();
  const writeFileProxy = fsWriteFileAdapterProxy();

  return {
    callResponder: InstallWriteFilesResponder,

    getWrittenFiles: (): ReadonlyArray<{ path: unknown; content: unknown }> =>
      writeFileProxy.getAllWrittenFiles(),

    getCreatedDirs: (): ReadonlyArray<unknown> => mkdirProxy.getCreatedDirs(),
  };
};
