/**
 * PURPOSE: Defines required devDependencies for dungeonmaster projects
 *
 * USAGE:
 * devDependenciesStatics.packages['typescript'];
 * // Returns '^5.8.3' version string
 */

export const devDependenciesStatics = {
  packages: {
    '@eslint/compat': '^1.3.1',
    '@eslint/eslintrc': '^3.3.1',
    '@types/debug': '^4.1.12',
    '@types/eslint': '^9.0.0',
    '@types/jest': '^30.0.0',
    '@types/node': '^24.0.15',
    '@types/prettier': '^2.7.3',
    '@typescript-eslint/eslint-plugin': '^8.35.1',
    '@typescript-eslint/parser': '^8.35.1',
    eslint: '^9.36.0',
    'eslint-config-prettier': '^10.1.5',
    'eslint-plugin-eslint-comments': '^3.2.0',
    'eslint-plugin-jest': '^29.0.1',
    'eslint-plugin-prettier': '^5.5.1',
    jest: '^30.0.4',
    prettier: '^3.6.2',
    'ts-jest': '^29.4.0',
    'ts-node': '^10.9.2',
    tsx: '^4.0.0',
    typescript: '^5.8.3',
  },
} as const;
