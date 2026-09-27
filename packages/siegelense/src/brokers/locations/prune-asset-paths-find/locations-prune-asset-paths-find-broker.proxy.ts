import { join } from '#gateway/node/path';
import { registerMock, requireActual } from '@dungeonmaster/testing/register-mock';

import { locationsBufferPathsFindBrokerProxy } from '../buffer-paths-find/locations-buffer-paths-find-broker.proxy';

// evidencePath arrives fully resolved as a parameter and every composed path runs through the
// real, deterministic `join` — there is nothing to stage beyond the real passthrough default and
// composing the child proxy enforce-proxy-child-creation requires. #gateway/node/path is a raw
// passthrough of the Node 'path' module (no per-function wrapper, so no gateway proxy to compose)
// — mocked directly here, on the same '#gateway/node/path' specifier the broker imports. Shared
// with locationsBufferPathsFindBrokerProxy's own join handle, so registering the same sticky
// real-passthrough default twice is harmless.
export const locationsPruneAssetPathsFindBrokerProxy = (): Record<PropertyKey, never> => {
  const realPath = requireActual<{ join: typeof join }>({ module: 'path' });
  registerMock({ fn: join })
    .calledWith([])
    .implement((...segments: never[]) => realPath.join(...segments));
  locationsBufferPathsFindBrokerProxy();

  return {};
};
