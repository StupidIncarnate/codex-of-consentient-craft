/**
 * PURPOSE: Proxy for tmpdir-find-broker
 *
 * USAGE:
 * const proxy = tmpdirFindBrokerProxy();
 * proxy.returns({ path: '/tmp' });
 * // Every later tmpdirFindBroker() call answers with that path
 */

import { tmpdir } from '#gateway/node/os';
import { registerMock } from '@dungeonmaster/testing/register-mock';

export const tmpdirFindBrokerProxy = (): {
  returns: ({ path }: { path: string }) => void;
} => {
  // `#gateway/node/os` is a bare passthrough of Node's 'os' (no wrapper body, no gateway proxy), so
  // the mock sits on the gateway's own re-export — the specifier the broker imports. tmpdir() takes no
  // argument, so there is nothing to key on; the default answer is a fixed path, never the real one.
  const handle = registerMock({ fn: tmpdir });
  handle.calledWith([]).returns('/tmp');

  return {
    returns: ({ path }: { path: string }): void => {
      handle.calledWith([]).returns(path);
    },
  };
};
