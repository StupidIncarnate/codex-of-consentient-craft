/**
 * PURPOSE: Empty proxy for npmModuleEsmOnlyBroker — it compiles a real in-memory probe with the
 * TypeScript compiler, whose reads run real against installed packages.
 *
 * USAGE:
 * npmModuleEsmOnlyBrokerProxy();
 * // No setup methods
 */

export const npmModuleEsmOnlyBrokerProxy = (): Record<PropertyKey, never> => ({});
