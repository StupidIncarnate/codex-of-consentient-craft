import { typescriptEslintEslintPluginLoadAdapter } from './typescript-eslint-eslint-plugin-load-adapter';
import { typescriptEslintEslintPluginLoadAdapterProxy } from './typescript-eslint-eslint-plugin-load-adapter.proxy';

describe('typescriptEslintEslintPluginLoadAdapter', () => {
  it('VALID: {} => returns eslint plugin with rules', () => {
    typescriptEslintEslintPluginLoadAdapterProxy();

    const result = typescriptEslintEslintPluginLoadAdapter();

    expect('array-type' in (result.rules as object)).toBe(true);
  });
});
