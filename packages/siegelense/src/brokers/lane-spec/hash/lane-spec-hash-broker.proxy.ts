// Both steps this broker composes are pure and deterministic (a transformer, and createHash
// from #gateway/node/crypto with nothing to mock) — the test needs the REAL digest to prove
// canonical-ordering stability and content sensitivity.
export const laneSpecHashBrokerProxy = (): Record<PropertyKey, never> => ({});
