// childCrashLayerBroker is a pure builder — everything it needs is passed in by the
// caller. No proxy methods needed; the empty proxy satisfies enforce-implementation-colocation.
export const childCrashLayerBrokerProxy = (): Record<PropertyKey, never> => ({});
