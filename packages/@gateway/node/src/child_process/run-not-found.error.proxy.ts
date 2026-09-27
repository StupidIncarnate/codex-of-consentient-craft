// `RunNotFoundError` is a plain error class, not a mockable I/O call — a caller `instanceof`-checks
// it directly, so there is nothing here to stage. This file exists only because
// `enforce-proxy-child-creation` derives an expected child proxy for every name a gateway barrel
// re-exports from a sibling file, `RunNotFoundError` included, and demands a caller outside the
// gateway carve-out (`enforce-proxy-child-creation` omits the gateway's own files) compose it. Same
// shape as `get-testing-patterns`' Empty Proxy Pattern for a pure export with no mocking to do.
export const RunNotFoundErrorProxy = (): Record<PropertyKey, never> => ({});
