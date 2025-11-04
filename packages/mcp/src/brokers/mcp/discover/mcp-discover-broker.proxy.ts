/**
 * PURPOSE: Proxy for mcp-discover-broker that composes file-scanner broker proxy
 *
 * USAGE:
 * const brokerProxy = mcpDiscoverBrokerProxy();
 * brokerProxy.setupFileDiscovery({ filepath, contents, pattern });
 * // Sets up file scanner broker to return metadata
 */

import { fileScannerBrokerProxy } from '../../file/scanner/file-scanner-broker.proxy';
import type { FilePath } from '../../../contracts/file-path/file-path-contract';
import type { FileContents } from '../../../contracts/file-contents/file-contents-contract';
import type { GlobPattern } from '../../../contracts/glob-pattern/glob-pattern-contract';

export const mcpDiscoverBrokerProxy = (): {
  setupFileDiscovery: (params: {
    filepath: FilePath;
    contents: FileContents;
    pattern: GlobPattern;
  }) => void;
  setupMultipleFileDiscovery: (params: {
    files: readonly { filepath: FilePath; contents: FileContents }[];
    pattern: GlobPattern;
  }) => void;
} => {
  const fileScannerProxy = fileScannerBrokerProxy();

  return {
    setupFileDiscovery: ({
      filepath,
      contents,
      pattern,
    }: {
      filepath: FilePath;
      contents: FileContents;
      pattern: GlobPattern;
    }): void => {
      fileScannerProxy.setupFileWithMetadata({ filepath, contents, pattern });
    },

    setupMultipleFileDiscovery: ({
      files,
      pattern,
    }: {
      files: readonly { filepath: FilePath; contents: FileContents }[];
      pattern: GlobPattern;
    }): void => {
      fileScannerProxy.setupMultipleFiles({ files, pattern });
    },
  };
};
