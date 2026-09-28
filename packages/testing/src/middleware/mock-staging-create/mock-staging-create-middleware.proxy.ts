/**
 * PURPOSE: Empty proxy — mockStagingCreateMiddleware composes a pure transformer with a pure,
 * deterministic gateway (no I/O to mock). Tests call the real middleware against real values.
 *
 * USAGE:
 * const proxy = mockStagingCreateMiddlewareProxy();
 * // Nothing to configure — call mockStagingCreateMiddleware directly
 */

import { isNativeErrorProxy } from '#gateway/node/util__types/is-native-error/is-native-error.proxy';

export const mockStagingCreateMiddlewareProxy = (): Record<PropertyKey, never> => {
  isNativeErrorProxy();

  return {};
};
