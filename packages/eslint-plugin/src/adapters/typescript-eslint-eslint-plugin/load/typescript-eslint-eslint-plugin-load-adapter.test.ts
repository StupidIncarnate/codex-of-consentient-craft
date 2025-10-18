import { typescriptEslintEslintPluginLoadAdapter } from './typescript-eslint-eslint-plugin-load-adapter';

describe('typescriptEslintEslintPluginLoadAdapter', () => {
  it('VALID: {} => returns eslint plugin with rules', () => {
    const result = typescriptEslintEslintPluginLoadAdapter();

    expect(result.rules).toBeDefined();
  });
});
