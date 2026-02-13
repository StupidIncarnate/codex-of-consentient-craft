// PURPOSE: Proxy for fetch-get-adapter - no-op because MSW intercepts fetch at the network level
// USAGE: Import in broker proxies to satisfy enforce-proxy-child-creation lint rule

export const fetchGetAdapterProxy = (): Record<PropertyKey, never> => ({});
