/**
 * PURPOSE: The file suffixes and folder convention the contract index scans, stated once so the
 * broker that walks a repo and any test that stages one agree, plus the folders a walk skips whole
 * (nothing under them can be production or harness source) and the folder and schema version of
 * its cache shards under indexCacheStatics' root. Bump `cache.schemaVersion` whenever a change
 * alters what a per-file read holds.
 *
 * USAGE:
 * contractIndexStatics.scan.sourceSuffixes;
 * // Returns ['.ts', '.tsx'] — the suffixes walked in every workspace package
 */
import { locationsStatics } from '../locations/locations-statics';

export const contractIndexStatics = {
  scan: {
    sourceSuffixes: ['.ts', '.tsx'],
    scopeFolderPrefix: '@',
  },
  parse: {
    methodNames: ['parse', 'safeParse', 'parseAsync', 'safeParseAsync'],
  },
  types: {
    inferNames: ['infer', 'input', 'output'],
    wrapperNames: ['Omit', 'Pick', 'Partial', 'Required', 'Readonly'],
  },
  resolve: {
    fileSuffixes: ['', '.ts', '.tsx', '/index.ts', '/index.tsx'],
  },
  walk: {
    skipFolderNames: [locationsStatics.repoRoot.nodeModules, locationsStatics.repoRoot.dist],
  },
  cache: {
    folderName: 'contract-index',
    schemaVersion: 1,
  },
} as const;
