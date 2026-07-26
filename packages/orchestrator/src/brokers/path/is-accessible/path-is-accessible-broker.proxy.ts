/**
 * PURPOSE: Proxy for path-is-accessible-broker that mocks fs access check
 *
 * USAGE:
 * const proxy = pathIsAccessibleBrokerProxy();
 * proxy.setupResult({ result: true });
 */

import { fsIsAccessibleAdapterProxy } from '../../../adapters/fs/is-accessible/fs-is-accessible-adapter.proxy';

export const pathIsAccessibleBrokerProxy = (): {
  setupResult: (params: { result: boolean }) => void;
} => {
  const accessProxy = fsIsAccessibleAdapterProxy();

  return {
    // No path parameter here to address: guildListBrokerProxy (this broker's only caller)
    // does not carry the underlying guild's real path down to this call — only the boolean
    // outcome. `defaultsToFound`/`defaultsToNotFound` are the genuinely-addressless fallback.
    setupResult: ({ result }: { result: boolean }): void => {
      if (result) {
        accessProxy.defaultsToFound();
      } else {
        accessProxy.defaultsToNotFound();
      }
    },
  };
};
