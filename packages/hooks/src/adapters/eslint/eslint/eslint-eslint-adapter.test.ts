import { eslintEslintAdapter } from './eslint-eslint-adapter';
import { eslintEslintAdapterProxy } from './eslint-eslint-adapter.proxy';
import type { ESLint } from 'eslint';

describe('eslintEslintAdapter', () => {
  it('should create ESLint instance with options', () => {
    const mockEslint = {} as ESLint;
    eslintEslintAdapterProxy.mockReturnValue(mockEslint);

    const options: ESLint.Options = {
      overrideConfigFile: true,
      baseConfig: { rules: { 'no-console': 'error' } },
    };

    const result = eslintEslintAdapter({ options });

    expect(result).toBe(mockEslint);
    expect(eslintEslintAdapterProxy).toHaveBeenCalledWith({ options });
  });
});
