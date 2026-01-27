import { fsReadFileAdapterProxy } from '../../../adapters/fs/read-file/fs-read-file-adapter.proxy';
import { fsWriteFileAdapterProxy } from '../../../adapters/fs/write-file/fs-write-file-adapter.proxy';

export const questUpdateStepBrokerProxy = (): {
  fsReadFileProxy: ReturnType<typeof fsReadFileAdapterProxy>;
  fsWriteFileProxy: ReturnType<typeof fsWriteFileAdapterProxy>;
} => {
  const fsReadFileProxy = fsReadFileAdapterProxy();
  const fsWriteFileProxy = fsWriteFileAdapterProxy();

  return {
    fsReadFileProxy,
    fsWriteFileProxy,
  };
};
