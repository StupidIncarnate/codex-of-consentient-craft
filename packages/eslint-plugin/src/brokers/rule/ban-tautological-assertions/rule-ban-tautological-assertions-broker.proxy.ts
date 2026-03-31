/**
 * PURPOSE: Proxy for ban-tautological-assertions rule broker
 *
 * USAGE:
 * ruleBanTautologicalAssertionsBrokerProxy();
 *
 * WHEN-TO-USE: Empty proxy - ESLint rules run with real parsing to validate DSL logic.
 */
export const ruleBanTautologicalAssertionsBrokerProxy = (): Record<PropertyKey, never> => ({});
