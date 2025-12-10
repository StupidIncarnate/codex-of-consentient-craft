import { fsReadFileAdapterProxy } from '../../../adapters/fs/read-file/fs-read-file-adapter.proxy';

export const questLoadBrokerProxy = (): {
  fsReadFileProxy: ReturnType<typeof fsReadFileAdapterProxy>;
} => {
  const fsReadFileProxy = fsReadFileAdapterProxy();

  return {
    fsReadFileProxy,
  };
};
