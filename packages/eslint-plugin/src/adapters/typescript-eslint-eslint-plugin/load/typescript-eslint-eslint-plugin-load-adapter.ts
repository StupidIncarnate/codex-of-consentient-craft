/**
 * PURPOSE: Loads the @typescript-eslint/eslint-plugin and adapts it to the EslintPlugin contract
 *
 * USAGE:
 * const plugin = typescriptEslintEslintPluginLoadAdapter();
 * // Returns the TypeScript ESLint plugin with type-aware linting rules
 */
import typescriptEslintPlugin from '@typescript-eslint/eslint-plugin';
import type { EslintPlugin } from '../../../contracts/eslint-plugin/eslint-plugin-contract';

export const typescriptEslintEslintPluginLoadAdapter = (): EslintPlugin =>
  typescriptEslintPlugin as EslintPlugin;
