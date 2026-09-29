/**
 * PURPOSE: The file suffixes and folder convention the contract index scans, stated once so the
 * broker that walks a repo and any test that stages one agree.
 *
 * USAGE:
 * contractIndexStatics.scan.sourceSuffixes;
 * // Returns ['.ts', '.tsx'] — the suffixes walked in every workspace package
 */

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
} as const;
