/**
 * PURPOSE: Proxy for path-is-accessible-broker that stages the fs access probe by exact path
 *
 * USAGE:
 * const proxy = pathIsAccessibleBrokerProxy();
 * proxy.setupResult({ path: GuildPathStub({ value: '/home/user/project' }), result: true });
 */

import type { GuildPath } from '@dungeonmaster/shared/contracts';
import { pathExistsProxy } from '#gateway/node/fs__promises/path-exists/path-exists.proxy';

export const pathIsAccessibleBrokerProxy = (): {
  setupResult: (params: { path: GuildPath; result: boolean }) => void;
  setupUnreadable: (params: { path: GuildPath }) => void;
} => {
  const accessProxy = pathExistsProxy();

  return {
    setupResult: ({ path, result }: { path: GuildPath; result: boolean }): void => {
      if (result) {
        accessProxy.present({ path });
      } else {
        accessProxy.missing({ path });
      }
    },
    setupUnreadable: ({ path }: { path: GuildPath }): void => {
      accessProxy.denied({ path });
    },
  };
};
