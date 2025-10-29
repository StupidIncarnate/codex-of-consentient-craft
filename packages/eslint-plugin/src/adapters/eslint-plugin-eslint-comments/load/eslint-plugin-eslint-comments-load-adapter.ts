import eslintPluginEslintComments from 'eslint-plugin-eslint-comments';
import type { EslintPlugin } from '../../../contracts/eslint-plugin/eslint-plugin-contract';

/**
 * PURPOSE: Loads the eslint-plugin-eslint-comments plugin and adapts it to the EslintPlugin contract
 *
 * USAGE:
 * const plugin = eslintPluginEslintCommentsLoadAdapter();
 * // Returns the eslint-comments plugin with rules for controlling ESLint directive comments
 */
export const eslintPluginEslintCommentsLoadAdapter = (): EslintPlugin =>
  eslintPluginEslintComments as EslintPlugin;
