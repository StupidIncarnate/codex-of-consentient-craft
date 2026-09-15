import { pathJoinAdapterProxy } from '@dungeonmaster/shared/testing';

// evidencePath and runId arrive fully resolved as parameters, and the composed paths run through
// pathJoinAdapter's real, deterministic implementation — there is nothing to stage beyond
// instantiating its proxy, which enforce-proxy-child-creation requires since the broker imports it.
export const locationsRunPathsFindBrokerProxy = (): Record<PropertyKey, never> => {
  pathJoinAdapterProxy();

  return {};
};
