/**
 * PURPOSE: Provides testing utilities for ink-testing-library render with real rendering
 *
 * USAGE:
 * const renderProxy = inkTestingLibraryRenderAdapterProxy();
 * // No longer mocks render - uses real ink-testing-library
 * // Use stdin.write for key simulation
 */

// This proxy is now minimal - the real ink-testing-library handles rendering
// Proxies for widgets can set up any broker/adapter mocks they need
// but should NOT mock ink components since real rendering is happening

export const inkTestingLibraryRenderAdapterProxy = (): Record<PropertyKey, never> =>
  // No-op - real ink-testing-library is used
  // Widget proxies should focus on mocking business logic dependencies,
  // not UI rendering which is now handled by the real library
  ({});
