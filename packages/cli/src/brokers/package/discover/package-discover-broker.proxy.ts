import { pathJoinAdapterProxy } from '@dungeonmaster/shared/testing';
import { fsExistsSyncAdapterProxy } from '@dungeonmaster/shared/testing';
import { fsReaddirAdapterProxy } from '../../../adapters/fs/readdir/fs-readdir-adapter.proxy';

export const packageDiscoverBrokerProxy = (): {
  fsReaddirProxy: ReturnType<typeof fsReaddirAdapterProxy>;
  pathJoinProxy: ReturnType<typeof pathJoinAdapterProxy>;
  fsExistsSyncProxy: ReturnType<typeof fsExistsSyncAdapterProxy>;
} => {
  const fsReaddirProxy = fsReaddirAdapterProxy();
  const pathJoinProxy = pathJoinAdapterProxy();
  const fsExistsSyncProxy = fsExistsSyncAdapterProxy();

  return {
    fsReaddirProxy,
    pathJoinProxy,
    fsExistsSyncProxy,
  };
};
