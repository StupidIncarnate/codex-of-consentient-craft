/**
 * PURPOSE: Proxy for rxjsTimeoutAdapter — adapter is a thin wrapper around rxjs.timeout() with no I/O to mock.
 */

export const rxjsTimeoutAdapterProxy = (): Record<PropertyKey, never> => ({});
