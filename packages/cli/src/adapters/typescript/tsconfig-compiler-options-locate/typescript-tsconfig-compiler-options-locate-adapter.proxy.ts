/**
 * PURPOSE: Empty proxy for typescriptTsconfigCompilerOptionsLocateAdapter — a real TypeScript JSON
 * parse validates the scanning logic, the same reason ESLint/SQL adapters run real rather than mocked.
 *
 * USAGE:
 * const proxy = typescriptTsconfigCompilerOptionsLocateAdapterProxy();
 */

export const typescriptTsconfigCompilerOptionsLocateAdapterProxy = (): Record<
  PropertyKey,
  never
> => ({});
