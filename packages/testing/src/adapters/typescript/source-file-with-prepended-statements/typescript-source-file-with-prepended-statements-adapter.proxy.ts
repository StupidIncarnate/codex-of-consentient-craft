/**
 * PURPOSE: Empty proxy for typescript-source-file-with-prepended-statements-adapter
 *
 * USAGE:
 * const proxy = typescriptSourceFileWithPrependedStatementsAdapterProxy();
 * // Empty proxy - TypeScript node factory runs real in tests
 */

export const typescriptSourceFileWithPrependedStatementsAdapterProxy = (): Record<
  PropertyKey,
  never
> => ({});
