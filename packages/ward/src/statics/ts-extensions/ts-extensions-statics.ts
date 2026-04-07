/**
 * PURPOSE: Defines the set of TypeScript file extensions used for glob pattern expansion
 *
 * USAGE:
 * tsExtensionsStatics.extensions.map(ext => `src/**\/*.${ext}`);
 * // Returns: ['src/**\/*.ts', 'src/**\/*.tsx']
 */
export const tsExtensionsStatics = {
  extensions: ['ts', 'tsx'],
  declarationExtensions: ['ts', 'd.ts'],
  // All source extensions that eslint and jest can process in user projects.
  // Ward runs in external codebases that may use JS/JSX alongside TS.
  allExtensions: ['ts', 'tsx', 'js', 'jsx'],
} as const;
