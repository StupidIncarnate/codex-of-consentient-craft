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
import { processCwdAdapter } from '@dungeonmaster/shared/adapters';
import { PathSegmentStub } from '@dungeonmaster/shared/contracts';
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
  // The scan root the broker resolves for both the scanner and its own empty-result probes.
  const scanRoot = PathSegmentStub({ value: processCwdAdapter() });
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
      // The scanner's file scan and the hint's directory probe run the same pattern from the same
      // root; they differ only in includeDirectories, which the adapter turns into nodir. So the
      // file scan finds nothing and the directory probe finds directories, addressed by nodir.
      fileScannerProxy.setupFiles({ files: [], pattern });
      globProxy.returns({
        pattern,
        cwd: scanRoot,
        includeDirectories: true,
        files: directoryPaths,
      });
    },

    setupGrepFilteredEmpty: ({
      filePaths,
      pattern,
    }: {
      filePaths: readonly PathSegment[];
      pattern: GlobPattern;
    }): void => {
      // The scanner's file scan and the hint's file-hit probe reach glob with identical arguments
      // — same pattern, same root, same nodir — and must answer differently: the scan sees the
      // files the grep then filters out, the probe reports that the glob itself did match. Two
      // one-shots, in the order the broker issues them, is the only way to tell them apart.
      globProxy.returnsOnce({ pattern, cwd: scanRoot, files: [] });
      globProxy.returnsOnce({ pattern, cwd: scanRoot, files: filePaths });
    },
  };
};
