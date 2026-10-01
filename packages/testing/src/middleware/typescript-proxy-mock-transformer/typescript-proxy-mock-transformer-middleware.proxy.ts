/**
 * PURPOSE: Proxy for typescript-proxy-mock-transformer-middleware — TypeScript AST operations run
 * real; the proxy files the hoister walks are staged in memory, by content and by which paths exist.
 *
 * USAGE:
 * const proxy = typescriptProxyMockTransformerMiddlewareProxy();
 * proxy.setupFileContains({ filePath: '/repo/a.proxy.ts', content: "export const aProxy = () => ({});" });
 * proxy.setupFilesOnDisk({ filePaths: ['/repo/a.proxy.ts'] });
 */

import { proxyMockCallsCollectMiddlewareProxy } from '../proxy-mock-calls-collect/proxy-mock-calls-collect-middleware.proxy';

export const typescriptProxyMockTransformerMiddlewareProxy = (): {
  setupFileContains: ({ filePath, content }: { filePath: string; content: string }) => void;
  setupFilesOnDisk: ({ filePaths }: { filePaths: readonly string[] }) => void;
} => {
  const collectProxy = proxyMockCallsCollectMiddlewareProxy();

  return {
    setupFileContains: ({ filePath, content }: { filePath: string; content: string }): void => {
      collectProxy.setupFileContains({ filePath, content });
    },
    setupFilesOnDisk: ({ filePaths }: { filePaths: readonly string[] }): void => {
      collectProxy.setupFilesOnDisk({ filePaths });
    },
  };
};
