import { pathJoinAdapterProxy } from '@dungeonmaster/shared/testing';

import { locationsBufferPathsFindBrokerProxy } from '../buffer-paths-find/locations-buffer-paths-find-broker.proxy';

// evidencePath arrives fully resolved as a parameter and every composed path runs through
// pathJoinAdapter's real, deterministic implementation — there is nothing to stage beyond
// instantiating the two child proxies enforce-proxy-child-creation requires.
export const locationsPruneAssetPathsFindBrokerProxy = (): Record<PropertyKey, never> => {
  pathJoinAdapterProxy();
  locationsBufferPathsFindBrokerProxy();

  return {};
};
