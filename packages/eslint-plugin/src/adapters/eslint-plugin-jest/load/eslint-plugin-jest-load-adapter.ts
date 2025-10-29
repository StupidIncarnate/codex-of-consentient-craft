import eslintPluginJest from 'eslint-plugin-jest';
import type { EslintPlugin } from '../../../contracts/eslint-plugin/eslint-plugin-contract';

/**
 * PURPOSE: Loads the eslint-plugin-jest plugin and adapts it to the EslintPlugin contract
 *
 * USAGE:
 * const plugin = eslintPluginJestLoadAdapter();
 * // Returns the Jest plugin with rules for writing Jest tests
 */
export const eslintPluginJestLoadAdapter = (): EslintPlugin => eslintPluginJest as EslintPlugin;
