/**
 * PURPOSE: Proxy for rxjsOfAdapter — adapter is a thin wrapper around rxjs.of() with no I/O to mock; the proxy exists to satisfy the codebase's proxy-required-per-adapter rule and to be composable from middleware/binding proxies.
 */

export const rxjsOfAdapterProxy = (): Record<PropertyKey, never> => ({});
