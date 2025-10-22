import eslintPluginJest from 'eslint-plugin-jest';
import type { EslintPlugin } from '../../../contracts/eslint-plugin/eslint-plugin-contract';

export const eslintPluginJestLoadAdapter = (): EslintPlugin => eslintPluginJest as EslintPlugin;
