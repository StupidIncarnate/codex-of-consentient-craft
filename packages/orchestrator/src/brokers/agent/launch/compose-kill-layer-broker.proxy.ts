// composeKillLayerBroker is a pure function — its only "dependencies" are the spawnKill,
// handle, and tailRef passed in by the caller. Tests construct mocks directly. No proxy
// methods needed; the empty proxy satisfies enforce-implementation-colocation.
export const composeKillLayerBrokerProxy = (): Record<PropertyKey, never> => ({});
