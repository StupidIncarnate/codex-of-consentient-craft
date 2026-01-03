/**
 * PURPOSE: Defines the list of valid ESLint configuration file names
 *
 * USAGE:
 * import { eslintConfigFilesStatics } from './eslint-config-files-statics';
 * const configFiles = eslintConfigFilesStatics;
 * // Returns: ['eslint.config.js', 'eslint.config.mjs', 'eslint.config.cjs']
 */

export const eslintConfigFilesStatics = [
  'eslint.config.js',
  'eslint.config.mjs',
  'eslint.config.cjs',
] as const;
