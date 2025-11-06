import type { ESLint } from 'eslint';

export const eslintEslintAdapterProxy = jest.fn<ESLint, [{ options: ESLint.Options }]>();

jest.mock('./eslint-eslint-adapter', () => ({
  eslintEslintAdapter: eslintEslintAdapterProxy,
}));
