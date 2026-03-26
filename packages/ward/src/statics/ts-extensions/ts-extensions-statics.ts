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
} as const;
