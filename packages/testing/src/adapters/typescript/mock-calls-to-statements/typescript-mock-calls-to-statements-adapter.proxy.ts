/**
 * PURPOSE: Empty proxy for typescript-mock-calls-to-statements-adapter
 *
 * USAGE:
 * const proxy = typescriptMockCallsToStatementsAdapterProxy();
 * // Empty proxy - TypeScript node factory runs real in tests
 */

export const typescriptMockCallsToStatementsAdapterProxy = (): Record<PropertyKey, never> => ({});
