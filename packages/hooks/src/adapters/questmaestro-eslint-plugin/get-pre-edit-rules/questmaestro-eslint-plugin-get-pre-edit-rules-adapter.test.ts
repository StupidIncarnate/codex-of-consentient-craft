import { questmaestroEslintPluginGetPreEditRulesAdapter } from './questmaestro-eslint-plugin-get-pre-edit-rules-adapter';
import { questmaestroEslintPluginGetPreEditRulesAdapterProxy } from './questmaestro-eslint-plugin-get-pre-edit-rules-adapter.proxy';

describe('questmaestroEslintPluginGetPreEditRulesAdapter', () => {
  it('VALID: {} => returns PreEditLintConfig structure with rules array', () => {
    questmaestroEslintPluginGetPreEditRulesAdapterProxy();

    const result = questmaestroEslintPluginGetPreEditRulesAdapter();

    expect(Array.isArray(result.rules)).toBe(true);
    expect(result.rules.length).toBeGreaterThan(0);
    expect(typeof result.rules[0]).toBe('string');
  });
});
