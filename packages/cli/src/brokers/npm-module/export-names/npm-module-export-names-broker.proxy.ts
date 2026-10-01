/**
 * PURPOSE: Empty proxy for npmModuleExportNamesBroker — its only reads are the TypeScript
 * compiler's own module resolution and declaration reads, which run real against installed packages.
 *
 * USAGE:
 * npmModuleExportNamesBrokerProxy();
 * // No setup methods
 */

export const npmModuleExportNamesBrokerProxy = (): Record<PropertyKey, never> => ({});
