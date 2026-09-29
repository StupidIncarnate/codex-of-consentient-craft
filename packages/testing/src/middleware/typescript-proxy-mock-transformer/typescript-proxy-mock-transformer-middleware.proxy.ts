/**
 * PURPOSE: Proxy for typescript-proxy-mock-transformer-middleware — TypeScript AST operations run
 * real; the proxy files the hoister walks are staged in memory, by content and by which paths exist.
 *
 * USAGE:
 * const proxy = typescriptProxyMockTransformerMiddlewareProxy();
 * proxy.setupFileContains({ filePath: '/repo/a.proxy.ts', content: "export const aProxy = () => ({});" });
 * proxy.setupFilesOnDisk({ filePaths: ['/repo/a.proxy.ts'] });
 */

import { importPathResolverMiddlewareProxy } from '../import-path-resolver/import-path-resolver-middleware.proxy';
import { proxyMockCollectorMiddlewareProxy } from '../proxy-mock-collector/proxy-mock-collector-middleware.proxy';

export const typescriptProxyMockTransformerMiddlewareProxy = (): {
  setupFileContains: ({ filePath, content }: { filePath: string; content: string }) => void;
  setupFilesOnDisk: ({ filePaths }: { filePaths: readonly string[] }) => void;
} => {
  const importPathProxy = importPathResolverMiddlewareProxy();
  const collectorProxy = proxyMockCollectorMiddlewareProxy();

  return {
    setupFileContains: ({ filePath, content }: { filePath: string; content: string }): void => {
      collectorProxy.setupFileContains({ filePath, content });
    },
    setupFilesOnDisk: ({ filePaths }: { filePaths: readonly string[] }): void => {
      importPathProxy.setupFilesOnDisk({ filePaths });
    },
  };
};
