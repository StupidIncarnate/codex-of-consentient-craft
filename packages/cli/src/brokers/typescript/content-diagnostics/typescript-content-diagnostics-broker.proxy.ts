/**
 * PURPOSE: Empty proxy for typescriptContentDiagnosticsBroker — a real TypeScript program must
 * run for real to prove a string typechecks, so there is nothing to mock.
 *
 * USAGE:
 * const proxy = typescriptContentDiagnosticsBrokerProxy();
 * // No setup methods — the broker runs a real ts.Program in every test
 */

export const typescriptContentDiagnosticsBrokerProxy = (): Record<PropertyKey, never> => ({});
