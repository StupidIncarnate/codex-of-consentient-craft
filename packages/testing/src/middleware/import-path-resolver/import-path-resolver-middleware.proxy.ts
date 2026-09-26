/**
 * PURPOSE: Proxy for import-path-resolver-middleware — stages which candidate files exist, so the
 * extension search runs against a described file system rather than the real checkout
 *
 * USAGE:
 * const proxy = importPathResolverMiddlewareProxy();
 * proxy.setupFilesOnDisk({ filePaths: ['/repo/src/a.proxy.ts'] });
 */

import { pathDirnameAdapterProxy } from '../../adapters/path/dirname/path-dirname-adapter.proxy';
import { pathResolveAdapterProxy } from '../../adapters/path/resolve/path-resolve-adapter.proxy';
import { fsExistsSyncAdapterProxy } from '../../adapters/fs/exists-sync/fs-exists-sync-adapter.proxy';

export const importPathResolverMiddlewareProxy = (): {
  setupFilesOnDisk: ({ filePaths }: { filePaths: readonly string[] }) => void;
  setupFilesOnDiskMatching: ({ pattern }: { pattern: RegExp }) => void;
} => {
  pathDirnameAdapterProxy();
  pathResolveAdapterProxy();
  const existsProxy = fsExistsSyncAdapterProxy();

  return {
    setupFilesOnDisk: ({ filePaths }: { filePaths: readonly string[] }): void => {
      existsProxy.existsOnlyFor({ filePaths });
    },
    setupFilesOnDiskMatching: ({ pattern }: { pattern: RegExp }): void => {
      existsProxy.existsWhereMatching({ pattern });
    },
  };
};
