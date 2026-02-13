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
    setupResult: ({ result }: { result: boolean }): void => {
      if (result) {
        accessProxy.resolves();
      } else {
        accessProxy.rejects({ error: new Error('ENOENT: no such file or directory') });
      }
    },
  };
};
