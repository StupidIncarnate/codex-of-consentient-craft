/**
 * PURPOSE: Empty proxy for proxy-mock-collector-middleware
 *
 * USAGE:
 * const proxy = proxyMockCollectorMiddlewareProxy();
 * // Empty proxy - TypeScript AST operations run real in tests
 */

import { typescriptSourceFileGetterAdapterProxy } from '../../adapters/typescript/source-file-getter/typescript-source-file-getter-adapter.proxy';
import { typescriptAstToMockCallsAdapterProxy } from '../../adapters/typescript/ast-to-mock-calls/typescript-ast-to-mock-calls-adapter.proxy';
import { typescriptAstToProxyImportsAdapterProxy } from '../../adapters/typescript/ast-to-proxy-imports/typescript-ast-to-proxy-imports-adapter.proxy';
import { importPathResolverMiddlewareProxy } from '../import-path-resolver/import-path-resolver-middleware.proxy';

export const proxyMockCollectorMiddlewareProxy = (): Record<PropertyKey, never> => {
  typescriptSourceFileGetterAdapterProxy();
  typescriptAstToMockCallsAdapterProxy();
  typescriptAstToProxyImportsAdapterProxy();
  importPathResolverMiddlewareProxy();

  return {};
};
