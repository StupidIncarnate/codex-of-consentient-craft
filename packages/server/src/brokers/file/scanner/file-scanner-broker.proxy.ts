/**
 * PURPOSE: Proxy for file-scanner-broker to setup test data for file discovery
 *
 * USAGE:
 * const brokerProxy = fileScannerBrokerProxy();
 * brokerProxy.setupFileWithMetadata({ filepath, contents, metadata });
 * // Sets up glob and read-file adapters to return test data
 */

import { workspaceRootFindBrokerProxy } from '../../workspace-root/find/workspace-root-find-broker.proxy';
import { globFindAdapterProxy } from '../../../adapters/glob/find/glob-find-adapter.proxy';
import { fsReadFileAdapterProxy } from '../../../adapters/fs/read-file/fs-read-file-adapter.proxy';
import { sharedPackageResolveAdapterProxy } from '../../../adapters/shared-package/resolve/shared-package-resolve-adapter.proxy';
import type { FilePath } from '../../../contracts/file-path/file-path-contract';
import type { FileContents } from '../../../contracts/file-contents/file-contents-contract';
import type { GlobPattern } from '../../../contracts/glob-pattern/glob-pattern-contract';

export const fileScannerBrokerProxy = (): {
  setupFileWithMetadata: (params: {
    filepath: FilePath;
    contents: FileContents;
    pattern: GlobPattern;
  }) => void;
  setupMultipleFiles: (params: {
    files: readonly { filepath: FilePath; contents: FileContents }[];
    pattern: GlobPattern;
  }) => void;
  setupSharedPackageAvailable: () => void;
  setupSharedPackageNotFound: () => void;
  setupSharedPackageFiles: (params: {
    files: readonly { filepath: FilePath; contents: FileContents }[];
    pattern: GlobPattern;
  }) => void;
} => {
  const globProxy = globFindAdapterProxy();
  const readFileProxy = fsReadFileAdapterProxy();
  const sharedProxy = sharedPackageResolveAdapterProxy();
  workspaceRootFindBrokerProxy();

  // Default: shared package not found
  sharedProxy.srcDoesNotExist();

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
    setupMultipleFiles: ({
      files,
      pattern,
    }: {
      files: readonly { filepath: FilePath; contents: FileContents }[];
      pattern: GlobPattern;
    }): void => {
      // Set up glob to return all file paths at once
      globProxy.returns({ pattern, files: files.map((f) => f.filepath) });
      // Set up readFile for each file
      for (const { filepath, contents } of files) {
        readFileProxy.returns({ filepath, contents });
      }
    },
    setupSharedPackageAvailable: (): void => {
      sharedProxy.srcExists();
    },
    setupSharedPackageNotFound: (): void => {
      sharedProxy.srcDoesNotExist();
    },
    setupSharedPackageFiles: ({
      files,
      pattern,
    }: {
      files: readonly { filepath: FilePath; contents: FileContents }[];
      pattern: GlobPattern;
    }): void => {
      sharedProxy.srcExists();
      // Set up glob to return empty for project (first call), then shared files (second call)
      // The broker scans project first, then shared
      globProxy.returns({ pattern, files: [] }); // project call returns empty
      globProxy.returns({ pattern, files: files.map((f) => f.filepath) }); // shared call returns files
      // Set up readFile for each shared file
      for (const { filepath, contents } of files) {
        readFileProxy.returns({ filepath, contents });
      }
    },
  };
};
