import { eslintCalculateConfigForFileAdapter } from './eslint-calculate-config-for-file-adapter';
import { eslintCalculateConfigForFileAdapterProxy } from './eslint-calculate-config-for-file-adapter.proxy';
import { LinterConfigStub } from '../../../contracts/linter-config/linter-config.stub';
import { EslintInstanceStub } from '../../../contracts/eslint-instance/eslint-instance.stub';
import type { ESLint } from 'eslint';

describe('eslintCalculateConfigForFileAdapter', () => {
  it('VALID: {eslint, filePath} => returns config from ESLint instance', async () => {
    eslintCalculateConfigForFileAdapterProxy();
    const mockConfig = LinterConfigStub({
      rules: { 'no-console': 'error' },
    });
    const mockEslint = EslintInstanceStub({
      calculateConfigForFile: jest.fn().mockResolvedValue(mockConfig),
    }) as unknown as ESLint;

    const result = await eslintCalculateConfigForFileAdapter({
      eslint: mockEslint,
      filePath: '/path/to/file.ts',
    });

    expect(result).toStrictEqual(mockConfig);
  });

  it('VALID: {eslint, filePath} => returns empty object when result is null', async () => {
    eslintCalculateConfigForFileAdapterProxy();
    const mockEslint = EslintInstanceStub({
      calculateConfigForFile: jest.fn().mockResolvedValue({}),
    }) as unknown as ESLint;

    const result = await eslintCalculateConfigForFileAdapter({
      eslint: mockEslint,
      filePath: '/path/to/file.ts',
    });

    expect(result).toStrictEqual({});
  });
});
