/**
 * PURPOSE: Proxy for file-scanner-broker to setup test data for file discovery with glob/grep
 * params. Stages @dungeonmaster/npm's `glob` gateway wrapper for BOTH scans the broker can make —
 * the project root, and, for a broad (**-prefixed) glob, the co-scanned @dungeonmaster/shared root
 * — because the gateway's `globProxy` has no zero-arg catch-all the way the local adapter proxy
 * it replaces did: an unaddressed call throws instead of quietly resolving empty, so both
 * addresses are computed here the same way the broker derives them, from the same mocked
 * `processCwdAdapter`/`sharedPackageResolveAdapter` inputs.
 *
 * USAGE:
 * const brokerProxy = fileScannerBrokerProxy();
 * brokerProxy.setupFiles({ files: [{ filepath, contents }], pattern });
 * // Sets up glob and read-file adapters to return test data
 */

import { globProxy } from '@dungeonmaster/npm/testing';
import { fsReadFileAdapterProxy } from '../../../adapters/fs/read-file/fs-read-file-adapter.proxy';
import { sharedPackageResolveAdapterProxy } from '../../../adapters/shared-package/resolve/shared-package-resolve-adapter.proxy';
import { sharedPackageResolveAdapter } from '../../../adapters/shared-package/resolve/shared-package-resolve-adapter';
import { globIgnoreFilterTransformer } from '../../../transformers/glob-ignore-filter/glob-ignore-filter-transformer';
import { fileDiscoveryStatics } from '../../../statics/file-discovery/file-discovery-statics';
import { processCwdAdapterProxy } from '@dungeonmaster/shared/testing';
import { processCwdAdapter } from '@dungeonmaster/shared/adapters';
import { PathSegmentStub, globPatternContract } from '@dungeonmaster/shared/contracts';
import type { FileContents, GlobPattern, PathSegment } from '@dungeonmaster/shared/contracts';

const BROAD_GLOB_PREFIX = '**';

export const fileScannerBrokerProxy = (): {
  setupFiles: (params: {
    files: readonly { filepath: PathSegment; contents: FileContents }[];
    pattern: GlobPattern;
    ignorePatterns?: readonly GlobPattern[];
  }) => void;
  setupFilesWithFailingReads: (params: {
    files: readonly {
      filepath: PathSegment;
      contents?: FileContents;
      error?: Error;
    }[];
    pattern: GlobPattern;
  }) => void;
  setupFilesAtRoot: (params: {
    rootPath: PathSegment;
    files: readonly { filepath: PathSegment; contents: FileContents }[];
    pattern: GlobPattern;
  }) => void;
  setupGlobFailure: (params: { pattern: GlobPattern; error: Error }) => void;
} => {
  processCwdAdapterProxy();
  // The scan root the broker will resolve, read from the same mocked adapter the broker calls.
  const scanRoot = PathSegmentStub({ value: processCwdAdapter() });
  const readFileProxy = fsReadFileAdapterProxy();
  sharedPackageResolveAdapterProxy();
  // A real call, made with the same mocked `existsSync` the line above just staged — the exact
  // root the broker will independently resolve for a broad glob's second scan.
  const sharedRoot = sharedPackageResolveAdapter();
  const globGateway = globProxy();

  // Reproduces the broker's own ignore computation (fileScannerBroker, "1. Resolve glob pattern"
  // step) so a staged call's address matches what the broker really sends: gateway's `glob.returns`
  // stages an EXACT options object, ignore list included, so a caller can no longer address a scan
  // while leaving its ignore list unaddressed the way the adapter proxy it replaces did.
  const ignoreFor = ({
    pattern,
    ignorePatterns,
  }: {
    pattern: GlobPattern;
    ignorePatterns?: readonly GlobPattern[];
  }): readonly GlobPattern[] =>
    globIgnoreFilterTransformer({
      patterns:
        ignorePatterns ??
        fileDiscoveryStatics.globIgnorePatterns.map((value) => globPatternContract.parse(value)),
      glob: pattern,
    });

  const stageScan = ({
    root,
    pattern,
    ignore,
    matches,
  }: {
    root: PathSegment;
    pattern: GlobPattern;
    ignore: readonly GlobPattern[];
    matches: readonly PathSegment[];
  }): void => {
    globGateway.returns({
      pattern: globPatternContract.parse(`${root}/${pattern}`),
      options: { cwd: root, ignore },
      matches: [...matches],
    });
  };

  // Stages the project scan, and — only when the glob is broad enough to trigger it — the
  // co-scan of @dungeonmaster/shared, which the broker always answers empty unless a test asks
  // otherwise (none here do; no test exercises the shared-package display-path substitution).
  const stageScans = ({
    root,
    pattern,
    ignore,
    matches,
  }: {
    root: PathSegment;
    pattern: GlobPattern;
    ignore: readonly GlobPattern[];
    matches: readonly PathSegment[];
  }): void => {
    stageScan({ root, pattern, ignore, matches });
    if (String(pattern).startsWith(BROAD_GLOB_PREFIX) && sharedRoot !== null) {
      stageScan({ root: sharedRoot, pattern, ignore, matches: [] });
    }
  };

  return {
    setupFiles: ({
      files,
      pattern,
      ignorePatterns,
    }: {
      files: readonly { filepath: PathSegment; contents: FileContents }[];
      pattern: GlobPattern;
      ignorePatterns?: readonly GlobPattern[];
    }): void => {
      stageScans({
        root: scanRoot,
        pattern,
        ignore: ignoreFor({ pattern, ...(ignorePatterns && { ignorePatterns }) }),
        matches: files.map((f) => f.filepath),
      });
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
      stageScans({
        root: scanRoot,
        pattern,
        ignore: ignoreFor({ pattern }),
        matches: files.map((f) => f.filepath),
      });
      for (const entry of files) {
        if (entry.error) {
          readFileProxy.throwsFor({ filepath: entry.filepath, error: entry.error });
        } else if (entry.contents) {
          readFileProxy.returnsFor({ filepath: entry.filepath, contents: entry.contents });
        }
      }
    },

    // For a call that passes an explicit `rootPath` — an address independent of the mocked
    // processCwdAdapter() default, proving the broker scanned from the PASSED root rather than
    // silently falling back to its own cwd.
    setupFilesAtRoot: ({
      rootPath,
      files,
      pattern,
    }: {
      rootPath: PathSegment;
      files: readonly { filepath: PathSegment; contents: FileContents }[];
      pattern: GlobPattern;
    }): void => {
      stageScans({
        root: rootPath,
        pattern,
        ignore: ignoreFor({ pattern }),
        matches: files.map((f) => f.filepath),
      });
      for (const { filepath, contents } of files) {
        readFileProxy.returnsFor({ filepath, contents });
      }
    },

    // Stages the project scan to REJECT, the way a bad pattern or an unreadable cwd does through
    // the gateway's own try/catch — proving the broker's rejection now carries the gateway's
    // pattern-naming message rather than a raw, unwrapped one.
    setupGlobFailure: ({ pattern, error }: { pattern: GlobPattern; error: Error }): void => {
      globGateway.throws({
        pattern: globPatternContract.parse(`${scanRoot}/${pattern}`),
        options: { cwd: scanRoot, ignore: ignoreFor({ pattern }) },
        error,
      });
    },
  };
};
