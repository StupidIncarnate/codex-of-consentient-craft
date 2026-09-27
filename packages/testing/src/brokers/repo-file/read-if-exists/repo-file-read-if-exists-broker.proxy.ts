/**
 * PURPOSE: Proxy for repoFileReadIfExistsBroker — composes the gateway wrapper's own proxy,
 * imported per file (`#gateway/node/fs__promises/read-file-if-exists/read-file-if-exists.proxy`,
 * never through a `_test_` barrel), so this broker's mock and the gateway's own test of that
 * wrapper share one staging surface for `fs/promises.readFile`.
 *
 * USAGE:
 * const proxy = repoFileReadIfExistsBrokerProxy();
 * proxy.returns({ path: '/repo/.dungeonmaster.json', contents: '{"port":3737}' });
 */

import { readFileIfExistsProxy } from '#gateway/node/fs__promises/read-file-if-exists/read-file-if-exists.proxy';

export const repoFileReadIfExistsBrokerProxy = (): {
  returns: (params: { path: string; contents: string }) => void;
  missing: (params: { path: string }) => void;
} => {
  const gatewayProxy = readFileIfExistsProxy();

  return {
    returns: ({ path, contents }: { path: string; contents: string }): void => {
      gatewayProxy.returns({ path, contents });
    },
    missing: ({ path }: { path: string }): void => {
      gatewayProxy.missing({ path });
    },
  };
};
