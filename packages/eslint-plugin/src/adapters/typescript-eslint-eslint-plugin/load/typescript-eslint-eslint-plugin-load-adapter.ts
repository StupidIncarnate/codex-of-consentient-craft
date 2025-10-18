import typescriptEslintPlugin from '@typescript-eslint/eslint-plugin';
import type { EslintPlugin } from '../../../contracts/eslint-plugin/eslint-plugin-contract';

export const typescriptEslintEslintPluginLoadAdapter = (): EslintPlugin =>
  typescriptEslintPlugin as unknown as EslintPlugin;
