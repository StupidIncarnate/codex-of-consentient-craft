/**
 * PURPOSE: Proxy for typescript-source-file-get-middleware — the TypeScript parse runs real; the
 * fallback read for a file the program does not hold is staged by path, by content or by absence.
 *
 * USAGE:
 * const proxy = typescriptSourceFileGetMiddlewareProxy();
 * proxy.fileContains({ filePath, content: 'export const x = 1;' });
 * proxy.fileMissing({ filePath });
 */

import { readFileSyncProxy } from '#gateway/node/fs/read-file-sync/read-file-sync.proxy';

export const typescriptSourceFileGetMiddlewareProxy = (): {
  fileContains: ({ filePath, content }: { filePath: string; content: string }) => void;
  fileMissing: ({ filePath }: { filePath: string }) => void;
} => {
  const readProxy = readFileSyncProxy();

  return {
    fileContains: ({ filePath, content }: { filePath: string; content: string }): void => {
      readProxy.returns({ path: filePath, contents: content });
    },
    fileMissing: ({ filePath }: { filePath: string }): void => {
      readProxy.throws({
        path: filePath,
        error: Object.assign(new Error(`ENOENT: no such file or directory, open '${filePath}'`), {
          code: 'ENOENT',
        }),
      });
    },
  };
};
