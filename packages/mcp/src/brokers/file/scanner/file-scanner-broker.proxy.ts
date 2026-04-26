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
import { processCwdAdapterProxy } from '@dungeonmaster/shared/testing';
import type { FileContents, GlobPattern, PathSegment } from '@dungeonmaster/shared/contracts';

export const fileScannerBrokerProxy = (): {
  setupFiles: (params: {
    files: readonly { filepath: PathSegment; contents: FileContents }[];
    pattern: GlobPattern;
  }) => void;
  setupFilesWithFailingReads: (params: {
    files: readonly {
      filepath: PathSegment;
      contents?: FileContents;
      error?: Error;
    }[];
    pattern: GlobPattern;
  }) => void;
} => {
  processCwdAdapterProxy();
  const globProxy = globFindAdapterProxy();
  const readFileProxy = fsReadFileAdapterProxy();
  sharedPackageResolveAdapterProxy();

  return {
    setupFiles: ({
      files,
      pattern,
    }: {
      files: readonly { filepath: PathSegment; contents: FileContents }[];
      pattern: GlobPattern;
    }): void => {
      globProxy.returns({ pattern, files: files.map((f) => f.filepath) });
      for (const { filepath, contents } of files) {
        readFileProxy.returns({ filepath, contents });
      }
    },
    setupFilesWithFailingReads: ({
      files,
      pattern,
    }: {
      files: readonly {
        filepath: PathSegment;
        contents?: FileContents;
        error?: Error;
      }[];
      pattern: GlobPattern;
    }): void => {
      globProxy.returns({ pattern, files: files.map((f) => f.filepath) });
      for (const entry of files) {
        if (entry.error) {
          readFileProxy.throws({ filepath: entry.filepath, error: entry.error });
        } else if (entry.contents) {
          readFileProxy.returns({ filepath: entry.filepath, contents: entry.contents });
        }
      }
    },
  };
};
