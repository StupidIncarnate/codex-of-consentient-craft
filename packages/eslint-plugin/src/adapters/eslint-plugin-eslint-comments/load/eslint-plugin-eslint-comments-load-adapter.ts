import eslintPluginEslintComments from 'eslint-plugin-eslint-comments';
import type { EslintPlugin } from '../../../contracts/eslint-plugin/eslint-plugin-contract';

export const eslintPluginEslintCommentsLoadAdapter = (): EslintPlugin =>
  eslintPluginEslintComments as EslintPlugin;
