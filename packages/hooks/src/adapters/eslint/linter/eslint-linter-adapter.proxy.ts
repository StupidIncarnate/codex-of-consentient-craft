import type { Linter } from 'eslint';

export const eslintLinterAdapterProxy = jest.fn<Linter, []>();

jest.mock('./eslint-linter-adapter', () => ({
  eslintLinterAdapter: eslintLinterAdapterProxy,
}));
