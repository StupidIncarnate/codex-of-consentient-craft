/**
 * PURPOSE: Proxy for e2e-testbed-create-broker providing test isolation
 *
 * USAGE:
 * const proxy = e2eTestbedCreateBrokerProxy();
 * // Composes child proxies for all dependencies
 */

import { installTestbedCreateBrokerProxy } from '../../install-testbed/create/install-testbed-create-broker.proxy';
import { e2eConfigSetupBrokerProxy } from '../../e2e-config/setup/e2e-config-setup-broker.proxy';
import { nodePtySpawnAdapterProxy } from '../../../adapters/node-pty/spawn/node-pty-spawn-adapter.proxy';
import { fsExistsAdapterProxy } from '../../../adapters/fs/exists/fs-exists-adapter.proxy';
import { fsReaddirAdapterProxy } from '../../../adapters/fs/readdir/fs-readdir-adapter.proxy';
import { fsReadFileAdapterProxy } from '../../../adapters/fs/read-file/fs-read-file-adapter.proxy';
import { pathJoinAdapterProxy } from '../../../adapters/path/join/path-join-adapter.proxy';

export const e2eTestbedCreateBrokerProxy = (): Record<PropertyKey, never> => {
  installTestbedCreateBrokerProxy();
  e2eConfigSetupBrokerProxy();
  nodePtySpawnAdapterProxy();
  fsExistsAdapterProxy();
  fsReaddirAdapterProxy();
  fsReadFileAdapterProxy();
  pathJoinAdapterProxy();

  return {};
};
