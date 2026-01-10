/**
 * PURPOSE: Proxy for ink Text adapter - no-op since real ink is used
 *
 * USAGE:
 * inkTextAdapterProxy(); // Sets up nothing - real Text component is used
 */

// Real ink components are used for testing via ink-testing-library
// No mocking needed - this proxy exists for API compatibility
export const inkTextAdapterProxy = (): Record<PropertyKey, never> => ({});
