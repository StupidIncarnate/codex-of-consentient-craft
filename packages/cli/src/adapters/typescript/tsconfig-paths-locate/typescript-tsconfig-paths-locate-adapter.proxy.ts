/**
 * PURPOSE: Empty proxy for typescriptTsconfigPathsLocateAdapter — a real TypeScript JSON parse
 * validates the scanning logic, the same reason ESLint/SQL adapters run real rather than mocked.
 *
 * USAGE:
 * const proxy = typescriptTsconfigPathsLocateAdapterProxy();
 */

export const typescriptTsconfigPathsLocateAdapterProxy = (): Record<PropertyKey, never> => ({});
