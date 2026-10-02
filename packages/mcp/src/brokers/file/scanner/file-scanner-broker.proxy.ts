/**
 * PURPOSE: Proxy for file-scanner-broker to setup test data for file discovery with glob/grep
 * params. Stages @dungeonmaster/npm's `glob` gateway wrapper for BOTH scans the broker can make —
 * the project root, and, for a broad (**-prefixed) glob, the co-scanned @dungeonmaster/shared root
 * — because the gateway's `globProxy` has no zero-arg catch-all the way the local adapter proxy
 * it replaces did: an unaddressed call throws instead of quietly resolving empty, so both
 * addresses are computed here the same way the broker derives them, from the same
 * `rootPath`/`resolvePackageRoot` inputs.
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
import type { FsError } from '#gateway/node/fs';

const BROAD_GLOB_PREFIX = '**';

export const fileScannerBrokerProxy = (): {
  setupFiles: (params: {
    files: readonly { filepath: string; contents: string }[];
    pattern: string;
    ignorePatterns?: readonly string[];
  }) => void;
  setupFilesWithFailingReads: (params: {
    files: readonly {
      filepath: string;
      contents?: string;
      error?: FsError;
    }[];
    pattern: string;
  }) => void;
  setupFilesAtRoot: (params: {
    rootPath: string;
    files: readonly { filepath: string; contents: string }[];
    pattern: string;
  }) => void;
  setupGlobFailure: (params: { pattern: string; error: Error }) => void;
} => {
  // The scan root the tests pass to the broker.
  const scanRoot = '/default/cwd';
  const readFileGateway = readFileProxy();
  resolvePackageRootProxy();
  // A real call — the gateway ships no mocking hook for this (a real `require.resolve` walk plus
  // real `package.json` checks) — computing the exact root the broker will independently resolve
  // for a broad glob's second scan.
  const resolvedSharedRoot = resolvePackageRoot({ specifier: '@dungeonmaster/shared/contracts' });
  const sharedRoot = resolvedSharedRoot === null ? null : resolvedSharedRoot;
  const globGateway = globProxy();

  // Reproduces the broker's own ignore computation (fileScannerBroker, "1. Resolve glob pattern"
  // step) so a staged call's address matches what the broker really sends: gateway's `glob.returns`
  // stages an EXACT options object, ignore list included, so a caller can no longer address a scan
  // while leaving its ignore list unaddressed the way the adapter proxy it replaces did.
  const ignoreFor = ({
    pattern,
    ignorePatterns,
  }: {
    pattern: string;
    ignorePatterns?: readonly string[];
  }): readonly string[] =>
    globIgnoreFilterTransformer({
      patterns: ignorePatterns ?? fileDiscoveryStatics.globIgnorePatterns.map((value) => value),
      glob: pattern,
    });

  const stageScan = ({
    root,
    pattern,
    ignore,
    matches,
  }: {
    root: string;
    pattern: string;
    ignore: readonly string[];
    matches: readonly string[];
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
    root: string;
    pattern: string;
    ignore: readonly string[];
    matches: readonly string[];
  }): void => {
    stageScan({ root, pattern, ignore, matches });
    if (pattern.startsWith(BROAD_GLOB_PREFIX) && sharedRoot !== null) {
      stageScan({ root: sharedRoot, pattern, ignore, matches: [] });
    }
  };

  return {
    setupFiles: ({
      files,
      pattern,
      ignorePatterns,
    }: {
      files: readonly { filepath: string; contents: string }[];
      pattern: string;
      ignorePatterns?: readonly string[];
    }): void => {
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
        filepath: string;
        contents?: string;
        error?: FsError;
      }[];
      pattern: string;
    }): void => {
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

    // For a call that passes an explicit `rootPath` — an address other than the
    // default scan root, proving the broker scanned from the PASSED root.
    setupFilesAtRoot: ({
      rootPath,
      files,
      pattern,
    }: {
      rootPath: string;
      files: readonly { filepath: string; contents: string }[];
      pattern: string;
    }): void => {
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
    setupGlobFailure: ({ pattern, error }: { pattern: string; error: Error }): void => {
      globGateway.throws({
        pattern: `${scanRoot}/${pattern}`,
        options: { cwd: scanRoot, ignore: ignoreFor({ pattern }) },
        error,
      });
    },
  };
};
