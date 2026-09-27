/**
 * PURPOSE: Proxy for proxy-mock-collector-middleware — TypeScript AST operations run real; the
 * source-file fallback read for a proxy file the program does not hold is staged, by content or by
 * absence, plus which relative import specifiers resolve to which files on disk.
 *
 * USAGE:
 * const proxy = proxyMockCollectorMiddlewareProxy();
 * proxy.setupProxyFileMissing({ proxyFilePath: '/nonexistent.proxy.ts' });
 * proxy.setupFileContains({ filePath: '/repo/a.proxy.ts', content: "export const aProxy = () => ({});" });
 * proxy.setupFilesOnDisk({ filePaths: ['/repo/a.proxy.ts'] });
 */

import { typescriptSourceFileGetterAdapterProxy } from '../../adapters/typescript/source-file-getter/typescript-source-file-getter-adapter.proxy';
import { typescriptAstToMockCallsAdapterProxy } from '../../adapters/typescript/ast-to-mock-calls/typescript-ast-to-mock-calls-adapter.proxy';
import { typescriptAstToModuleMockCallsAdapterProxy } from '../../adapters/typescript/ast-to-module-mock-calls/typescript-ast-to-module-mock-calls-adapter.proxy';
import { typescriptAstToProxyImportsAdapterProxy } from '../../adapters/typescript/ast-to-proxy-imports/typescript-ast-to-proxy-imports-adapter.proxy';
import { importPathResolverMiddlewareProxy } from '../import-path-resolver/import-path-resolver-middleware.proxy';
import { proxyReexportNamesResolveMiddlewareProxy } from '../proxy-reexport-names-resolve/proxy-reexport-names-resolve-middleware.proxy';
import { pathDirnameAdapterProxy } from '../../adapters/path/dirname/path-dirname-adapter.proxy';
import { pathResolveAdapterProxy } from '../../adapters/path/resolve/path-resolve-adapter.proxy';

export const proxyMockCollectorMiddlewareProxy = (): {
  setupProxyFileMissing: ({ proxyFilePath }: { proxyFilePath: string }) => void;
  setupFileContains: ({ filePath, content }: { filePath: string; content: string }) => void;
  setupFilesOnDisk: ({ filePaths }: { filePaths: readonly string[] }) => void;
} => {
  const sourceFileProxy = typescriptSourceFileGetterAdapterProxy();
  typescriptAstToMockCallsAdapterProxy();
  typescriptAstToModuleMockCallsAdapterProxy();
  typescriptAstToProxyImportsAdapterProxy();
  const importPathProxy = importPathResolverMiddlewareProxy();
  proxyReexportNamesResolveMiddlewareProxy();
  pathDirnameAdapterProxy();
  pathResolveAdapterProxy();

  return {
    setupProxyFileMissing: ({ proxyFilePath }: { proxyFilePath: string }): void => {
      sourceFileProxy.fileMissing({ filePath: proxyFilePath });
    },
    setupFileContains: ({ filePath, content }: { filePath: string; content: string }): void => {
      sourceFileProxy.fileContains({ filePath, content });
    },
    setupFilesOnDisk: ({ filePaths }: { filePaths: readonly string[] }): void => {
      importPathProxy.setupFilesOnDisk({ filePaths });
    },
  };
};
