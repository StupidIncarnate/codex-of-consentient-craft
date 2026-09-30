/**
 * PURPOSE: Proxy for file-scanner-broker to setup test data for file discovery with glob/grep
 * params. Stages @dungeonmaster/npm's `glob` gateway wrapper for BOTH scans the broker can make —
 * the project root, and, for a broad (**-prefixed) glob, the co-scanned @dungeonmaster/shared root
 * — because the gateway's `globProxy` has no zero-arg catch-all the way the local adapter proxy
 * it replaces did: an unaddressed call throws instead of quietly resolving empty, so both
 * addresses are computed here the same way the broker derives them, from the same
 * `cwd`/`resolvePackageRoot` inputs.
 *
 * USAGE:
 * const brokerProxy = fileScannerBrokerProxy();
 * brokerProxy.setupFiles({ files: [{ filepath, contents }], pattern });
 * // Sets up glob and read-file adapters to return test data
 */

import { globProxy } from '#gateway/npm/glob/glob/glob.proxy';
import { readFileProxy } from '#gateway/node/fs__promises/read-file/read-file.proxy';
import { resolvePackageRootProxy } from '#gateway/node/module/resolve-package-root/resolve-package-root.proxy';
import { resolvePackageRoot } from '#gateway/node/module';
import { globIgnoreFilterTransformer } from '../../../transformers/glob-ignore-filter/glob-ignore-filter-transformer';
import { fileDiscoveryStatics } from '../../../statics/file-discovery/file-discovery-statics';
import { cwdProxy } from '#gateway/node/process/cwd/cwd.proxy';
import { globPatternContract, pathSegmentContract } from '@dungeonmaster/shared/contracts';
import { PathSegmentStub } from '@dungeonmaster/shared/contracts/path-segment/path-segment.stub';
import type { FileContents, GlobPattern, PathSegment } from '@dungeonmaster/shared/contracts';
import type { FsError } from '#gateway/node/fs';

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
      error?: FsError;
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
  const cwdStage = cwdProxy();
  const stageDefaultCwd = (): void => {
    cwdStage.setupCwd({ value: '/default/cwd' });
  };
  // The scan root the broker will resolve, read from the same gateway the broker calls.
  const scanRoot = PathSegmentStub({ value: '/default/cwd' });
  const readFileGateway = readFileProxy();
  resolvePackageRootProxy();
  // A real call — the gateway ships no mocking hook for this (a real `require.resolve` walk plus
  // real `package.json` checks) — computing the exact root the broker will independently resolve
  // for a broad glob's second scan.
  const resolvedSharedRoot = resolvePackageRoot({ specifier: '@dungeonmaster/shared/contracts' });
  const sharedRoot =
    resolvedSharedRoot === null ? null : pathSegmentContract.parse(resolvedSharedRoot);
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
    pattern: string;
    ignore: readonly string[];
    matches: readonly PathSegment[];
  }): void => {
    globGateway.returns({
      pattern: `${root}/${pattern}`,
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
    pattern: string;
    ignore: readonly string[];
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
      stageDefaultCwd();
      stageScans({
        root: scanRoot,
        pattern,
        ignore: ignoreFor({ pattern, ...(ignorePatterns && { ignorePatterns }) }),
        matches: files.map((f) => f.filepath),
      });
      for (const { filepath, contents } of files) {
        readFileGateway.returns({ path: filepath, contents });
      }
    },
    setupFilesWithFailingReads: ({
      files,
      pattern,
    }: {
      files: readonly {
        filepath: PathSegment;
        contents?: FileContents;
        error?: FsError;
      }[];
      pattern: GlobPattern;
    }): void => {
      stageDefaultCwd();
      stageScans({
        root: scanRoot,
        pattern,
        ignore: ignoreFor({ pattern }),
        matches: files.map((f) => f.filepath),
      });
      for (const entry of files) {
        if (entry.error) {
          readFileGateway.throwsMatchingPath({ path: entry.filepath, error: entry.error });
        } else if (entry.contents) {
          readFileGateway.returns({ path: entry.filepath, contents: entry.contents });
        }
      }
    },

    // For a call that passes an explicit `rootPath` — an address independent of the
    // cwd() default, proving the broker scanned from the PASSED root rather than
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
      stageDefaultCwd();
      stageScans({
        root: rootPath,
        pattern,
        ignore: ignoreFor({ pattern }),
        matches: files.map((f) => f.filepath),
      });
      for (const { filepath, contents } of files) {
        readFileGateway.returns({ path: filepath, contents });
      }
    },

    // Stages the project scan to REJECT, the way a bad pattern or an unreadable cwd does through
    // the gateway's own try/catch — proving the broker's rejection now carries the gateway's
    // pattern-naming message rather than a raw, unwrapped one.
    setupGlobFailure: ({ pattern, error }: { pattern: GlobPattern; error: Error }): void => {
      stageDefaultCwd();
      globGateway.throws({
        pattern: globPatternContract.parse(`${scanRoot}/${pattern}`),
        options: { cwd: scanRoot, ignore: ignoreFor({ pattern }) },
        error,
      });
    },
  };
};
