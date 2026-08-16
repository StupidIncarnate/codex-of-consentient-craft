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
import { processCwdAdapter } from '@dungeonmaster/shared/adapters';
import { PathSegmentStub } from '@dungeonmaster/shared/contracts';
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
  getGlobOptionsFor: (params: { pattern: GlobPattern }) => unknown;
} => {
  processCwdAdapterProxy();
  // The scan root the broker will resolve, read from the same mocked adapter the broker calls.
  // The broker joins it onto the caller's glob before the glob package sees it, and passes it as
  // glob's cwd, so staged answers are addressed to a scan from this root.
  const scanRoot = PathSegmentStub({ value: processCwdAdapter() });
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
      globProxy.returns({ pattern, cwd: scanRoot, files: files.map((f) => f.filepath) });
      for (const { filepath, contents } of files) {
        readFileProxy.returnsFor({ filepath, contents });
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
      globProxy.returns({ pattern, cwd: scanRoot, files: files.map((f) => f.filepath) });
      for (const entry of files) {
        if (entry.error) {
          readFileProxy.throwsFor({ filepath: entry.filepath, error: entry.error });
        } else if (entry.contents) {
          readFileProxy.returnsFor({ filepath: entry.filepath, contents: entry.contents });
        }
      }
    },

    // What the broker actually asked glob to skip — the only place the escape-hatch filtering it
    // applies to the ignore list is observable.
    getGlobOptionsFor: ({ pattern }: { pattern: GlobPattern }): unknown =>
      globProxy.getOptionsFor({ pattern }),
  };
};
