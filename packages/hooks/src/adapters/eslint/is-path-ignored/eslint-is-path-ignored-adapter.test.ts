import { eslintIsPathIgnoredAdapter } from './eslint-is-path-ignored-adapter';
import { eslintIsPathIgnoredAdapterProxy } from './eslint-is-path-ignored-adapter.proxy';
import { EslintInstanceStub } from '../../../contracts/eslint-instance/eslint-instance.stub';
import type { ESLint } from 'eslint';

describe('eslintIsPathIgnoredAdapter', () => {
  it('VALID: {eslint reports ignored, filePath} => returns true', async () => {
    eslintIsPathIgnoredAdapterProxy();
    const mockEslint = EslintInstanceStub({
      isPathIgnored: jest.fn().mockResolvedValue(true),
    }) as unknown as ESLint;

    const result = await eslintIsPathIgnoredAdapter({
      eslint: mockEslint,
      filePath: '/project/smoke-repo/fixture.ts',
    });

    expect(result).toBe(true);
  });

  it('VALID: {eslint reports not ignored, filePath} => returns false', async () => {
    eslintIsPathIgnoredAdapterProxy();
    const mockEslint = EslintInstanceStub({
      isPathIgnored: jest.fn().mockResolvedValue(false),
    }) as unknown as ESLint;

    const result = await eslintIsPathIgnoredAdapter({
      eslint: mockEslint,
      filePath: '/project/src/file.ts',
    });

    expect(result).toBe(false);
  });
});
