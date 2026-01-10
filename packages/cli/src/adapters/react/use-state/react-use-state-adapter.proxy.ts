/**
 * PURPOSE: Proxy for React useState adapter - no-op since real React is used
 *
 * USAGE:
 * reactUseStateAdapterProxy(); // Sets up nothing - real useState hook is used
 *
 * With ink-testing-library, React hooks work correctly because components
 * are rendered within React's reconciler. No mocking needed.
 */

// Real React hooks are used for testing via ink-testing-library
// No mocking needed - this proxy exists for API compatibility
export const reactUseStateAdapterProxy = (): Record<PropertyKey, never> => ({});
