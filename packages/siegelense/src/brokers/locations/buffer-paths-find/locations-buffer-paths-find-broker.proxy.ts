import { pathJoinAdapterProxy } from '@dungeonmaster/shared/testing';

// evidencePath arrives fully resolved as a parameter, and the composed paths run through
// pathJoinAdapter's real, deterministic implementation — there is nothing to stage beyond
// instantiating its proxy, which enforce-proxy-child-creation requires since the broker imports it.
export const locationsBufferPathsFindBrokerProxy = (): Record<PropertyKey, never> => {
  pathJoinAdapterProxy();

  return {};
};
