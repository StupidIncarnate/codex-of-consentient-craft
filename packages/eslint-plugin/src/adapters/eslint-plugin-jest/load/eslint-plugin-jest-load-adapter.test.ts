import { eslintPluginJestLoadAdapter } from './eslint-plugin-jest-load-adapter';
import { eslintPluginJestLoadAdapterProxy } from './eslint-plugin-jest-load-adapter.proxy';

describe('eslintPluginJestLoadAdapter', () => {
  it('VALID: {} => returns eslint plugin with rules', () => {
    eslintPluginJestLoadAdapterProxy();

    const result = eslintPluginJestLoadAdapter();

    expect(typeof result.rules).toBe('object');
  });
});
