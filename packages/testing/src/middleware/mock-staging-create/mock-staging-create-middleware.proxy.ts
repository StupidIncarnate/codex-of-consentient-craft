/**
 * PURPOSE: Empty proxy — mockStagingCreateMiddleware composes a pure transformer with a pure,
 * deterministic adapter (no I/O to mock). Tests call the real middleware against real values.
 *
 * USAGE:
 * const proxy = mockStagingCreateMiddlewareProxy();
 * // Nothing to configure — call mockStagingCreateMiddleware directly
 */

import { errorIsNativeErrorAdapterProxy } from '../../adapters/error/is-native-error/error-is-native-error-adapter.proxy';

export const mockStagingCreateMiddlewareProxy = (): Record<PropertyKey, never> => {
  errorIsNativeErrorAdapterProxy();

  return {};
};
