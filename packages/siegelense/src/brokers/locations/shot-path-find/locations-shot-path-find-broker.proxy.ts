import { pathJoinAdapterProxy } from '@dungeonmaster/shared/testing';

// shotsDir and step arrive fully resolved as parameters, and the composed path runs through
// pathJoinAdapter's real, deterministic implementation — there is nothing to stage beyond
// instantiating its proxy, which enforce-proxy-child-creation requires since the broker imports it.
export const locationsShotPathFindBrokerProxy = (): Record<PropertyKey, never> => {
  pathJoinAdapterProxy();

  return {};
};
