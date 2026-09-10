/**
 * PURPOSE: Proxy for os-tmpdir-adapter
 *
 * USAGE:
 * const proxy = osTmpdirAdapterProxy();
 * proxy.returns({ path: '/tmp' });
 * // Every later osTmpdirAdapter() call answers with that path
 */

import { tmpdir } from 'os';
import { registerMock } from '@dungeonmaster/testing/register-mock';

export const osTmpdirAdapterProxy = (): {
  returns: ({ path }: { path: string }) => void;
} => {
  const handle = registerMock({ fn: tmpdir });

  // No argument to key on, so this is the honest catch-all rather than a lazy one.
  handle.calledWith([]).returns('/tmp');

  return {
    returns: ({ path }: { path: string }): void => {
      handle.calledWith([]).returns(path);
    },
  };
};
