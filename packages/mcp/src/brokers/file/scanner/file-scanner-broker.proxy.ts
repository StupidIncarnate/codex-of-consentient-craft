/**
 * PURPOSE: Proxy for file-scanner-broker to setup test data for file discovery
 *
 * USAGE:
 * const brokerProxy = fileScannerBrokerProxy();
 * brokerProxy.setupFileWithMetadata({ filepath, contents, metadata });
 * // Sets up glob and read-file adapters to return test data
 */

import { globFindAdapterProxy } from '../../../adapters/glob/find/glob-find-adapter.proxy';
import { fsReadFileAdapterProxy } from '../../../adapters/fs/read-file/fs-read-file-adapter.proxy';
import type { FilePath } from '../../../contracts/file-path/file-path-contract';
import type { FileContents } from '../../../contracts/file-contents/file-contents-contract';
import type { GlobPattern } from '../../../contracts/glob-pattern/glob-pattern-contract';

export const fileScannerBrokerProxy = (): {
  setupFileWithMetadata: (params: {
    filepath: FilePath;
    contents: FileContents;
    pattern: GlobPattern;
  }) => void;
} => {
  const globProxy = globFindAdapterProxy();
  const readFileProxy = fsReadFileAdapterProxy();

  return {
    setupFileWithMetadata: ({
      filepath,
      contents,
      pattern,
    }: {
      filepath: FilePath;
      contents: FileContents;
      pattern: GlobPattern;
    }): void => {
      globProxy.returns({ pattern, files: [filepath] });
      readFileProxy.returns({ filepath, contents });
    },
  };
};
