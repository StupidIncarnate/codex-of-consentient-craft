/**
 * PURPOSE: Proxy for path-is-accessible-broker that stages the fs access probe by exact path
 *
 * USAGE:
 * const proxy = pathIsAccessibleBrokerProxy();
 * proxy.setupResult({ path: GuildPathStub({ value: '/home/user/project' }), result: true });
 */

import { pathExistsProxy } from '#gateway/node/fs__promises/path-exists/path-exists.proxy';

export const pathIsAccessibleBrokerProxy = (): {
  setupResult: (params: { path: string; result: boolean }) => void;
  setupUnreadable: (params: { path: string }) => void;
} => {
  const accessProxy = pathExistsProxy();

  return {
    setupResult: ({ path, result }: { path: string; result: boolean }): void => {
      if (result) {
        accessProxy.present({ path });
      } else {
        accessProxy.missing({ path });
      }
    },
    setupUnreadable: ({ path }: { path: string }): void => {
      accessProxy.denied({ path });
    },
  };
};
