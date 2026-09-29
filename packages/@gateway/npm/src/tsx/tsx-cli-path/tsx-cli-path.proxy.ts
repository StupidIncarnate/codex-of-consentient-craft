// `require.resolve` is a per-file CommonJS binding a test cannot intercept, and resolving a real
// installed package is the whole behaviour, so there is nothing to stage. This file exists because
// `enforce-proxy-child-creation` derives an expected child proxy for every name a gateway barrel
// re-exports and demands a caller compose it.
export const tsxCliPathProxy = (): Record<PropertyKey, never> => ({});
