import { pathJoinAdapterProxy } from '../adapters/path/join/path-join-adapter.proxy';
import { fsReadFileAdapterProxy } from '../adapters/fs/read-file/fs-read-file-adapter.proxy';
import { fsWriteFileAdapterProxy } from '../adapters/fs/write-file/fs-write-file-adapter.proxy';

export const StartInstallProxy = (): {
  pathJoin: ReturnType<typeof pathJoinAdapterProxy>;
  fsReadFile: ReturnType<typeof fsReadFileAdapterProxy>;
  fsWriteFile: ReturnType<typeof fsWriteFileAdapterProxy>;
} => {
  const pathJoin = pathJoinAdapterProxy();
  const fsReadFile = fsReadFileAdapterProxy();
  const fsWriteFile = fsWriteFileAdapterProxy();

  return {
    pathJoin,
    fsReadFile,
    fsWriteFile,
  };
};
