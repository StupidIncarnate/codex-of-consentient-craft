import { eslintCalculateConfigForFileAdapter } from './eslint-calculate-config-for-file-adapter';
import { eslintCalculateConfigForFileAdapterProxy } from './eslint-calculate-config-for-file-adapter.proxy';
import type { ESLint, Linter } from 'eslint';

describe('eslintCalculateConfigForFileAdapter', () => {
  it('should return config from ESLint instance', async () => {
    const mockConfig: Linter.Config = { rules: { 'no-console': 'error' } };
    eslintCalculateConfigForFileAdapterProxy.mockResolvedValue(mockConfig);

    const mockEslint = {} as ESLint;
    const result = await eslintCalculateConfigForFileAdapter({
      eslint: mockEslint,
      filePath: '/path/to/file.ts',
    });

    expect(result).toBe(mockConfig);
  });

  it('should return empty object when result is null', async () => {
    eslintCalculateConfigForFileAdapterProxy.mockResolvedValue({});

    const mockEslint = {} as ESLint;
    const result = await eslintCalculateConfigForFileAdapter({
      eslint: mockEslint,
      filePath: '/path/to/file.ts',
    });

    expect(result).toEqual({});
  });
});
