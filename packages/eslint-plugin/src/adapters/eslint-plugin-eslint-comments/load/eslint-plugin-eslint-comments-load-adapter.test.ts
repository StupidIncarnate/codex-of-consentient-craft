import { eslintPluginEslintCommentsLoadAdapter } from './eslint-plugin-eslint-comments-load-adapter';
import { eslintPluginEslintCommentsLoadAdapterProxy } from './eslint-plugin-eslint-comments-load-adapter.proxy';

describe('eslintPluginEslintCommentsLoadAdapter', () => {
  it('VALID: {} => returns eslint plugin with rules', () => {
    eslintPluginEslintCommentsLoadAdapterProxy();

    const result = eslintPluginEslintCommentsLoadAdapter();

    expect(result.rules).toBeDefined();
  });
});
