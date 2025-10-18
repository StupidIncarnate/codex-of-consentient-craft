import { eslintPluginJestLoadAdapter } from './eslint-plugin-jest-load-adapter';

describe('eslintPluginJestLoadAdapter', () => {
  it('VALID: {} => returns eslint plugin with rules', () => {
    const result = eslintPluginJestLoadAdapter();

    expect(result.rules).toBeDefined();
  });
});
