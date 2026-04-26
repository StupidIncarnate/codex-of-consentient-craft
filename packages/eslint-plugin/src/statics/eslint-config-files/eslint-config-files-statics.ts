/**
 * PURPOSE: Defines the list of valid ESLint configuration file names
 *
 * USAGE:
 * import { eslintConfigFilesStatics } from './eslint-config-files-statics';
 * const configFiles = eslintConfigFilesStatics;
 * // Returns: ['eslint.config.js', 'eslint.config.mjs', 'eslint.config.cjs']
 */

import { locationsStatics } from '@dungeonmaster/shared/statics';

export const eslintConfigFilesStatics = locationsStatics.repoRoot.eslintConfig.slice(1);
