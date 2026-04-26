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
import { processCwdAdapterProxy } from '@dungeonmaster/shared/testing';
import type { FileContents, GlobPattern, PathSegment } from '@dungeonmaster/shared/contracts';

export const mcpDiscoverBrokerProxy = (): {
  setupFileDiscovery: (params: {
    filepath: PathSegment;
    contents: FileContents;
    pattern: GlobPattern;
  }) => void;
  setupMultipleFileDiscovery: (params: {
    files: readonly { filepath: PathSegment; contents: FileContents }[];
    pattern: GlobPattern;
  }) => void;
  setupEmptyWithDirectoryHits: (params: {
    directoryPaths: readonly PathSegment[];
    pattern: GlobPattern;
  }) => void;
  setupGrepFilteredEmpty: (params: {
    filePaths: readonly PathSegment[];
    pattern: GlobPattern;
  }) => void;
} => {
  processCwdAdapterProxy();
  const fileScannerProxy = fileScannerBrokerProxy();
  const globProxy = globFindAdapterProxy();

  return {
    setupFileDiscovery: ({
      filepath,
      contents,
      pattern,
    }: {
      filepath: PathSegment;
      contents: FileContents;
      pattern: GlobPattern;
    }): void => {
      fileScannerProxy.setupFiles({ files: [{ filepath, contents }], pattern });
    },

    setupMultipleFileDiscovery: ({
      files,
      pattern,
    }: {
      files: readonly { filepath: PathSegment; contents: FileContents }[];
      pattern: GlobPattern;
    }): void => {
      fileScannerProxy.setupFiles({ files, pattern });
    },

    setupEmptyWithDirectoryHits: ({
      directoryPaths,
      pattern,
    }: {
      directoryPaths: readonly PathSegment[];
      pattern: GlobPattern;
    }): void => {
      // First glob call (from scanner) returns no files.
      fileScannerProxy.setupFiles({ files: [], pattern });
      // Second glob call (the includeDirectories probe) returns the directory paths.
      globProxy.returns({ pattern, files: directoryPaths });
    },

    setupGrepFilteredEmpty: ({
      filePaths,
      pattern,
    }: {
      filePaths: readonly PathSegment[];
      pattern: GlobPattern;
    }): void => {
      // File scanner returns no files (because grep filtered them all out).
      fileScannerProxy.setupFiles({ files: [], pattern });
      // Next glob call (the nodir:true probe) returns files — glob DID match, grep didn't.
      globProxy.returns({ pattern, files: filePaths });
    },
  };
};
