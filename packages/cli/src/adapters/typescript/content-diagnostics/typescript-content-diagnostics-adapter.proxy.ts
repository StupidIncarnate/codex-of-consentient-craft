/**
 * PURPOSE: Empty proxy for typescript-content-diagnostics-adapter — a real TypeScript program must
 * run for real to prove a string typechecks, so there is nothing to mock.
 *
 * USAGE:
 * const proxy = typescriptContentDiagnosticsAdapterProxy();
 * // No setup methods — the adapter runs a real ts.Program in every test
 */

export const typescriptContentDiagnosticsAdapterProxy = (): Record<PropertyKey, never> => ({});
