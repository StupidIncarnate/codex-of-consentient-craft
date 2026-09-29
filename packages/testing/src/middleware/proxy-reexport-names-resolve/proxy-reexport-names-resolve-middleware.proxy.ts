/**
 * PURPOSE: Proxy for proxyReexportNamesResolveMiddleware — TypeScript AST operations run real; only
 * the source-file lookup for each candidate module path needs staging (its content, or that it is
 * missing), plus which relative import specifiers resolve to which files on disk.
 *
 * USAGE:
 * const proxy = proxyReexportNamesResolveMiddlewareProxy();
 * proxy.setupFileContains({ filePath: '/repo/a.ts', content: "export const a = 1;" });
 * proxy.setupFilesOnDisk({ filePaths: ['/repo/a.ts', '/repo/b.ts'] });
 * proxy.setupFileMissing({ filePath: '/nonexistent.ts' });
 */

import { typescriptSourceFileGetMiddlewareProxy } from '../typescript-source-file-get/typescript-source-file-get-middleware.proxy';
import { importPathResolverMiddlewareProxy } from '../import-path-resolver/import-path-resolver-middleware.proxy';

export const proxyReexportNamesResolveMiddlewareProxy = (): {
  setupFileContains: ({ filePath, content }: { filePath: string; content: string }) => void;
  setupFileMissing: ({ filePath }: { filePath: string }) => void;
  setupFilesOnDisk: ({ filePaths }: { filePaths: readonly string[] }) => void;
} => {
  const sourceFileProxy = typescriptSourceFileGetMiddlewareProxy();
  const importPathProxy = importPathResolverMiddlewareProxy();

  return {
    setupFileContains: ({ filePath, content }: { filePath: string; content: string }): void => {
      sourceFileProxy.fileContains({ filePath, content });
    },
    setupFileMissing: ({ filePath }: { filePath: string }): void => {
      sourceFileProxy.fileMissing({ filePath });
    },
    setupFilesOnDisk: ({ filePaths }: { filePaths: readonly string[] }): void => {
      importPathProxy.setupFilesOnDisk({ filePaths });
    },
  };
};
