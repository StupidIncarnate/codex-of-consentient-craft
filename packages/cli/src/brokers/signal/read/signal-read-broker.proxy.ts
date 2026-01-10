import { fsReadFileAdapterProxy } from '../../../adapters/fs/read-file/fs-read-file-adapter.proxy';
import { fsUnlinkAdapterProxy } from '../../../adapters/fs/unlink/fs-unlink-adapter.proxy';

export const signalReadBrokerProxy = (): {
  fsReadFileProxy: ReturnType<typeof fsReadFileAdapterProxy>;
  fsUnlinkProxy: ReturnType<typeof fsUnlinkAdapterProxy>;
} => {
  const fsReadFileProxy = fsReadFileAdapterProxy();
  const fsUnlinkProxy = fsUnlinkAdapterProxy();

  return {
    fsReadFileProxy,
    fsUnlinkProxy,
  };
};
