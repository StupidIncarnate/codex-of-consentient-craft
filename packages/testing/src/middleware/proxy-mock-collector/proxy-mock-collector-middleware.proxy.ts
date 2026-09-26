/**
 * PURPOSE: Proxy for proxy-mock-collector-middleware — TypeScript AST operations run real; the
 * source-file fallback read for a proxy file the program does not hold is staged
 *
 * USAGE:
 * const proxy = proxyMockCollectorMiddlewareProxy();
 * proxy.setupProxyFileMissing({ proxyFilePath: '/nonexistent.proxy.ts' });
 */

import { typescriptSourceFileGetterAdapterProxy } from '../../adapters/typescript/source-file-getter/typescript-source-file-getter-adapter.proxy';
import { typescriptAstToMockCallsAdapterProxy } from '../../adapters/typescript/ast-to-mock-calls/typescript-ast-to-mock-calls-adapter.proxy';
import { typescriptAstToModuleMockCallsAdapterProxy } from '../../adapters/typescript/ast-to-module-mock-calls/typescript-ast-to-module-mock-calls-adapter.proxy';
import { typescriptAstToProxyImportsAdapterProxy } from '../../adapters/typescript/ast-to-proxy-imports/typescript-ast-to-proxy-imports-adapter.proxy';
import { importPathResolverMiddlewareProxy } from '../import-path-resolver/import-path-resolver-middleware.proxy';
import { pathDirnameAdapterProxy } from '../../adapters/path/dirname/path-dirname-adapter.proxy';
import { pathResolveAdapterProxy } from '../../adapters/path/resolve/path-resolve-adapter.proxy';

export const proxyMockCollectorMiddlewareProxy = (): {
  setupProxyFileMissing: ({ proxyFilePath }: { proxyFilePath: string }) => void;
} => {
  const sourceFileProxy = typescriptSourceFileGetterAdapterProxy();
  typescriptAstToMockCallsAdapterProxy();
  typescriptAstToModuleMockCallsAdapterProxy();
  typescriptAstToProxyImportsAdapterProxy();
  importPathResolverMiddlewareProxy();
  pathDirnameAdapterProxy();
  pathResolveAdapterProxy();

  return {
    setupProxyFileMissing: ({ proxyFilePath }: { proxyFilePath: string }): void => {
      sourceFileProxy.fileMissing({ filePath: proxyFilePath });
    },
  };
};
