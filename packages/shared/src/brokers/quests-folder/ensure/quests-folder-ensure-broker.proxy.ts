/**
 * PURPOSE: Proxy for questsFolderEnsureBroker that composes find broker and mkdir adapter proxies
 *
 * USAGE:
 * const { findProxy, mkdirProxy } = questsFolderEnsureBrokerProxy();
 */

import { fsMkdirAdapterProxy } from '../../../adapters/fs/mkdir/fs-mkdir-adapter.proxy';
import { questsFolderFindBrokerProxy } from '../find/quests-folder-find-broker.proxy';

export const questsFolderEnsureBrokerProxy = (): {
  findProxy: ReturnType<typeof questsFolderFindBrokerProxy>;
  mkdirProxy: ReturnType<typeof fsMkdirAdapterProxy>;
} => {
  const findProxy = questsFolderFindBrokerProxy();
  const mkdirProxy = fsMkdirAdapterProxy();

  return {
    findProxy,
    mkdirProxy,
  };
};
