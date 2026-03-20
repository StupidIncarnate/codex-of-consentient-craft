/**
 * PURPOSE: Proxy for ban-jest-mock-in-proxies rule broker integration tests
 *
 * USAGE:
 * ruleBanJestMockInProxiesBrokerProxy();
 * // Sets up empty proxy - rule is pure AST analysis, no mocking needed
 */
export const ruleBanJestMockInProxiesBrokerProxy = (): Record<PropertyKey, never> => ({});
