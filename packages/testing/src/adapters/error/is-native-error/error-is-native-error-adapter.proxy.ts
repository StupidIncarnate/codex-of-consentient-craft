/**
 * PURPOSE: Empty proxy for `errorIsNativeErrorAdapter` — a pure, deterministic wrapper over
 * `util/types.isNativeError` with no I/O to mock. Tests call the real adapter against real values
 * (including a genuine cross-realm `vm` error), which is the whole point of what it checks.
 *
 * USAGE:
 * const proxy = errorIsNativeErrorAdapterProxy();
 * // Nothing to configure — call errorIsNativeErrorAdapter directly
 */

export const errorIsNativeErrorAdapterProxy = (): Record<PropertyKey, never> => ({});
