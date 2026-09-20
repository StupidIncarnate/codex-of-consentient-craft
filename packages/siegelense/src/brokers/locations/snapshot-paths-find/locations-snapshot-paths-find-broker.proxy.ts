import { pathJoinAdapterProxy } from '@dungeonmaster/shared/testing';

// homePath and ordinal arrive fully resolved as parameters, and the composed paths run through
// pathJoinAdapter's real, deterministic implementation — there is nothing to stage beyond
// instantiating its proxy, which enforce-proxy-child-creation requires since the broker imports it.
// Deliberately stages NO one-shot: a parent proxy composing this one must not have its own
// pathJoinAdapter calls answered by a queued value it never asked for.
export const locationsSnapshotPathsFindBrokerProxy = (): Record<PropertyKey, never> => {
  pathJoinAdapterProxy();

  return {};
};
