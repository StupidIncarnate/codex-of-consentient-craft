/**
 * PURPOSE: Empty proxy for typescript-proxy-mock-transformer-adapter
 *
 * USAGE:
 * const proxy = typescriptProxyMockTransformerAdapterProxy();
 * // Empty proxy - transformer runs real for integration testing with TypeScript compiler
 */

import { typescriptProxyMockTransformerMiddlewareProxy } from '../../../middleware/typescript-proxy-mock-transformer/typescript-proxy-mock-transformer-middleware.proxy';

export const typescriptProxyMockTransformerAdapterProxy = (): Record<PropertyKey, never> => {
  typescriptProxyMockTransformerMiddlewareProxy();

  return {};
};
