/**
 * PURPOSE: Empty proxy - nodePtySpawnAdapter is used in E2E integration tests
 *
 * USAGE:
 * const proxy = nodePtySpawnAdapterProxy();
 * // No mocks needed - adapter wraps node-pty for real PTY functionality
 * // E2E tests use actual PTY processes
 */

export const nodePtySpawnAdapterProxy = (): Record<PropertyKey, never> => ({});
