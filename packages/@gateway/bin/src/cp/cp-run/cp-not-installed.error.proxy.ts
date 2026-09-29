// `CpNotInstalledError` is a plain error class, not a mockable I/O call — a caller `instanceof`-checks
// it directly, so there is nothing here to stage. This file exists only because
// `enforce-proxy-child-creation` derives an expected child proxy for every name a gateway barrel
// re-exports from a sibling file, and demands a caller outside the gateway compose it.
export const CpNotInstalledErrorProxy = (): Record<PropertyKey, never> => ({});
