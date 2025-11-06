import type { ESLint, Linter } from 'eslint';

export const eslintCalculateConfigForFileAdapterProxy = jest.fn<
  Promise<Linter.Config>,
  [{ eslint: ESLint; filePath: string }]
>();

jest.mock('./eslint-calculate-config-for-file-adapter', () => ({
  eslintCalculateConfigForFileAdapter: eslintCalculateConfigForFileAdapterProxy,
}));
