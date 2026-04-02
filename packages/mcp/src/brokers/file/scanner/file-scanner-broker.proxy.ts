/**
 * PURPOSE: Proxy for file-scanner-broker to setup test data for file discovery with glob/grep params
 *
 * USAGE:
 * const brokerProxy = fileScannerBrokerProxy();
 * brokerProxy.setupFiles({ files: [{ filepath, contents }], pattern });
 * // Sets up glob and read-file adapters to return test data
 */

import { globFindAdapterProxy } from '../../../adapters/glob/find/glob-find-adapter.proxy';
import { fsReadFileAdapterProxy } from '../../../adapters/fs/read-file/fs-read-file-adapter.proxy';
import { sharedPackageResolveAdapterProxy } from '../../../adapters/shared-package/resolve/shared-package-resolve-adapter.proxy';
import type { FilePath } from '../../../contracts/file-path/file-path-contract';
import type { FileContents } from '../../../contracts/file-contents/file-contents-contract';
import type { GlobPattern } from '../../../contracts/glob-pattern/glob-pattern-contract';

export const fileScannerBrokerProxy = (): {
  setupFiles: (params: {
    files: readonly { filepath: FilePath; contents: FileContents }[];
    pattern: GlobPattern;
  }) => void;
} => {
  const globProxy = globFindAdapterProxy();
  const readFileProxy = fsReadFileAdapterProxy();
  sharedPackageResolveAdapterProxy();

  return {
    setupFiles: ({
      files,
      pattern,
    }: {
      files: readonly { filepath: FilePath; contents: FileContents }[];
      pattern: GlobPattern;
    }): void => {
      globProxy.returns({ pattern, files: files.map((f) => f.filepath) });
      for (const { filepath, contents } of files) {
        readFileProxy.returns({ filepath, contents });
      }
    },
  };
};
