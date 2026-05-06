/**
 * PURPOSE: Proxy for rxjsMergeAdapter — the adapter is a thin wrapper around rxjs.merge() with no I/O to mock; the proxy exists to satisfy the codebase's proxy-required-per-adapter rule and to be composable from middleware/binding proxies.
 */

export const rxjsMergeAdapterProxy = (): Record<PropertyKey, never> => ({});
