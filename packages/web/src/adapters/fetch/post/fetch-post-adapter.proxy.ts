// PURPOSE: Proxy for fetch-post-adapter - no-op because MSW intercepts fetch at the network level
// USAGE: Import in broker proxies to satisfy enforce-proxy-child-creation lint rule

export const fetchPostAdapterProxy = (): Record<PropertyKey, never> => ({});
