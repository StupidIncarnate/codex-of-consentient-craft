// Proxy for eslint-plugin-jest adapter
// This adapter is a simple re-export, no mocking needed
export const eslintPluginJestLoadAdapterProxy = (): Record<PropertyKey, never> => ({});
