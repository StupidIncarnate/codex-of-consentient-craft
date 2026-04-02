/**
 * PURPOSE: Constants for file discovery and scanning behavior
 *
 * USAGE:
 * import { fileDiscoveryStatics } from '../../statics/file-discovery/file-discovery-statics';
 * fileDiscoveryStatics.standaloneMultiDotSuffixes; // ['.harness.']
 */
export const fileDiscoveryStatics = {
  /**
   * Multi-dot suffixes that are standalone implementation files,
   * not companion files (.test.ts, .proxy.ts, .stub.ts, etc.)
   */
  standaloneMultiDotSuffixes: ['.harness.'],

  /**
   * Path anchors used to extract the sub-path for mirroring across scan roots.
   * e.g. packages/foo/src/contracts → src/contracts applied to shared too.
   */
  pathAnchors: ['src', 'test'],

  /**
   * Pluralization rules for folder name → singular type conversion.
   * Checked in order; first match wins.
   */
  pluralSuffixes: {
    /** Strip 'es' for words like harnesses → harness */
    esSuffix: { ending: 'ses', stripLength: 2 },
    /** Strip 's' for words like brokers → broker */
    sSuffix: { ending: 's', stripLength: 1 },
  },

  /**
   * Default glob ignore patterns for file scanning.
   * Each entry is a glob pattern that excludes a directory tree.
   * When the user's glob explicitly targets one of these directories,
   * that ignore rule is removed to allow access.
   */
  globIgnorePatterns: ['**/node_modules/**', '**/dist/**', '**/build/**', '**/.git/**'],

  /**
   * Minimum number of path parts required after a path anchor for folder-based type detection.
   * Must be >= 2 so that the part immediately after the anchor is a folder name, not a filename.
   * e.g. test/harnesses/foo.ts → harnesses is a folder (2 parts after 'test')
   *      test/foo.ts → foo.ts is a file, not a folder (only 1 part after 'test')
   */
  minPartsAfterAnchor: 2,
} as const;
