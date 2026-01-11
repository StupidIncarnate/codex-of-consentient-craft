import { pathJoinAdapterProxy, questsFolderEnsureBrokerProxy } from '@dungeonmaster/shared/testing';

import { fsReaddirAdapterProxy } from '../../../adapters/fs/readdir/fs-readdir-adapter.proxy';
import { questLoadBrokerProxy } from '../load/quest-load-broker.proxy';

export const questListBrokerProxy = (): {
  questsFolderProxy: ReturnType<typeof questsFolderEnsureBrokerProxy>;
  fsReaddirProxy: ReturnType<typeof fsReaddirAdapterProxy>;
  pathJoinProxy: ReturnType<typeof pathJoinAdapterProxy>;
  questLoadProxy: ReturnType<typeof questLoadBrokerProxy>;
} => {
  const questsFolderProxy = questsFolderEnsureBrokerProxy();
  const fsReaddirProxy = fsReaddirAdapterProxy();
  const pathJoinProxy = pathJoinAdapterProxy();
  const questLoadProxy = questLoadBrokerProxy();

  return {
    questsFolderProxy,
    fsReaddirProxy,
    pathJoinProxy,
    questLoadProxy,
  };
};
