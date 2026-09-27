/**
 * PURPOSE: Empty proxy for `isNativeError` — a pure, deterministic wrapper over
 * `util/types.isNativeError` with no I/O to mock. Tests call the real function against real
 * values (including a genuine cross-realm `vm` error), which is the whole point of what it checks.
 *
 * USAGE:
 * const proxy = isNativeErrorProxy();
 * // Nothing to configure — call isNativeError directly
 */

export const isNativeErrorProxy = (): Record<PropertyKey, never> => ({});
