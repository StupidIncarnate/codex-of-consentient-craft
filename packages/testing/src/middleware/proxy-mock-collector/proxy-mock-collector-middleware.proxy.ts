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
import { importPathResolverMiddlewareProxy } from '../import-path-resolver/import-path-resolver-middleware.proxy';
import { proxyReexportNamesResolveMiddlewareProxy } from '../proxy-reexport-names-resolve/proxy-reexport-names-resolve-middleware.proxy';

export const proxyMockCollectorMiddlewareProxy = (): {
  setupProxyFileMissing: ({ proxyFilePath }: { proxyFilePath: string }) => void;
  setupFileContains: ({ filePath, content }: { filePath: string; content: string }) => void;
  setupFilesOnDisk: ({ filePaths }: { filePaths: readonly string[] }) => void;
} => {
  const sourceFileProxy = typescriptSourceFileGetterAdapterProxy();
  const importPathProxy = importPathResolverMiddlewareProxy();
  proxyReexportNamesResolveMiddlewareProxy();

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
