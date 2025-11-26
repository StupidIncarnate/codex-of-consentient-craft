/**
 * PURPOSE: Empty proxy for typescript-proxy-mock-transformer-middleware
 *
 * USAGE:
 * const proxy = typescriptProxyMockTransformerMiddlewareProxy();
 * // Empty proxy - TypeScript AST operations run real in tests
 */

import { typescriptAstToProxyImportsAdapterProxy } from '../../adapters/typescript/ast-to-proxy-imports/typescript-ast-to-proxy-imports-adapter.proxy';
import { typescriptMockCallsToStatementsAdapterProxy } from '../../adapters/typescript/mock-calls-to-statements/typescript-mock-calls-to-statements-adapter.proxy';
import { typescriptSourceFileWithPrependedStatementsAdapterProxy } from '../../adapters/typescript/source-file-with-prepended-statements/typescript-source-file-with-prepended-statements-adapter.proxy';
import { importPathResolverMiddlewareProxy } from '../import-path-resolver/import-path-resolver-middleware.proxy';
import { proxyMockCollectorMiddlewareProxy } from '../proxy-mock-collector/proxy-mock-collector-middleware.proxy';

export const typescriptProxyMockTransformerMiddlewareProxy = (): Record<PropertyKey, never> => {
  typescriptAstToProxyImportsAdapterProxy();
  typescriptMockCallsToStatementsAdapterProxy();
  typescriptSourceFileWithPrependedStatementsAdapterProxy();
  importPathResolverMiddlewareProxy();
  proxyMockCollectorMiddlewareProxy();

  return {};
};
