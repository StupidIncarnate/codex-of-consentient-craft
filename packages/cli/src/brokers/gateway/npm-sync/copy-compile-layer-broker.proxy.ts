/**
 * PURPOSE: Empty proxy for copyCompileLayerBroker — it compiles real in-memory files with the
 * TypeScript compiler, whose reads of lib files and installed packages run real.
 *
 * USAGE:
 * copyCompileLayerBrokerProxy();
 * // No setup methods
 */

export const copyCompileLayerBrokerProxy = (): Record<PropertyKey, never> => ({});
