/**
 * PURPOSE: Proxy for mcp-discover-broker that composes file-scanner broker proxy
 *
 * USAGE:
 * const brokerProxy = mcpDiscoverBrokerProxy();
 * brokerProxy.setupFileDiscovery({ filepath, contents, pattern });
 * // Sets up file scanner broker to return metadata
 */

import { fileScannerBrokerProxy } from '../../file/scanner/file-scanner-broker.proxy';
import { globFindAdapterProxy } from '../../../adapters/glob/find/glob-find-adapter.proxy';
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
  setupEmptyWithDirectoryHits: (params: {
    directoryPaths: readonly FilePath[];
    pattern: GlobPattern;
  }) => void;
} => {
  const fileScannerProxy = fileScannerBrokerProxy();
  const globProxy = globFindAdapterProxy();

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
      fileScannerProxy.setupFiles({ files: [{ filepath, contents }], pattern });
    },

    setupMultipleFileDiscovery: ({
      files,
      pattern,
    }: {
      files: readonly { filepath: FilePath; contents: FileContents }[];
      pattern: GlobPattern;
    }): void => {
      fileScannerProxy.setupFiles({ files, pattern });
    },

    setupEmptyWithDirectoryHits: ({
      directoryPaths,
      pattern,
    }: {
      directoryPaths: readonly FilePath[];
      pattern: GlobPattern;
    }): void => {
      // First glob call (from scanner) returns no files.
      fileScannerProxy.setupFiles({ files: [], pattern });
      // Second glob call (the includeDirectories probe) returns the directory paths.
      globProxy.returns({ pattern, files: directoryPaths });
    },
  };
};
