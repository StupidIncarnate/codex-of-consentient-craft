/**
 * PURPOSE: Empty proxy for is-allowed-harness-member-call-guard
 *
 * USAGE:
 * const proxy = isAllowedHarnessMemberCallGuardProxy();
 * // Empty proxy — pure guard with no dependencies to mock
 */

export const isAllowedHarnessMemberCallGuardProxy = (): Record<PropertyKey, never> => ({});
