/**
 * PURPOSE: Proxy for rxjsTakeAdapter — adapter is a thin wrapper around rxjs.take() with no I/O to mock.
 */

export const rxjsTakeAdapterProxy = (): Record<PropertyKey, never> => ({});
