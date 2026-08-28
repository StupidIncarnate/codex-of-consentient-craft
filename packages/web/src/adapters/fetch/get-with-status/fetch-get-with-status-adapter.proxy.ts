// PURPOSE: Proxy for fetch-get-with-status-adapter - no-op because MSW intercepts fetch at the network level
// USAGE: Import in broker proxies to satisfy enforce-proxy-child-creation lint rule

export const fetchGetWithStatusAdapterProxy = (): Record<PropertyKey, never> => ({});
