jest.mock('fs/promises');

import { fsUnlinkAdapterProxy } from '../../../adapters/fs/unlink/fs-unlink-adapter.proxy';

export const signalCleanupBrokerProxy = (): {
  fsUnlinkProxy: ReturnType<typeof fsUnlinkAdapterProxy>;
} => {
  const fsUnlinkProxy = fsUnlinkAdapterProxy();

  return {
    fsUnlinkProxy,
  };
};
