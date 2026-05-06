/**
 * PURPOSE: Proxy for rxjsFilterAdapter — adapter is a thin wrapper around rxjs.filter() with no I/O to mock.
 */

export const rxjsFilterAdapterProxy = (): Record<PropertyKey, never> => ({});
