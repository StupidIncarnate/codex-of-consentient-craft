import { eslintPluginEslintCommentsLoadAdapter } from './eslint-plugin-eslint-comments-load-adapter';

describe('eslintPluginEslintCommentsLoadAdapter', () => {
  it('VALID: {} => returns eslint plugin with rules', () => {
    const result = eslintPluginEslintCommentsLoadAdapter();

    expect(result.rules).toBeDefined();
  });
});
