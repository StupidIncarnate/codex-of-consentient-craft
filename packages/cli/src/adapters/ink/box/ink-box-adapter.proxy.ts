/**
 * PURPOSE: Proxy for ink Box adapter - no-op since real ink is used
 *
 * USAGE:
 * inkBoxAdapterProxy(); // Sets up nothing - real Box component is used
 */

// Real ink components are used for testing via ink-testing-library
// No mocking needed - this proxy exists for API compatibility
export const inkBoxAdapterProxy = (): Record<PropertyKey, never> => ({});
