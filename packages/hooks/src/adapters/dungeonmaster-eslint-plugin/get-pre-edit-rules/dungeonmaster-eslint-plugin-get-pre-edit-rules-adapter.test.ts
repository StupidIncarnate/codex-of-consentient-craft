import { dungeonmasterEslintPluginGetPreEditRulesAdapter } from './dungeonmaster-eslint-plugin-get-pre-edit-rules-adapter';
import { dungeonmasterEslintPluginGetPreEditRulesAdapterProxy } from './dungeonmaster-eslint-plugin-get-pre-edit-rules-adapter.proxy';

describe('dungeonmasterEslintPluginGetPreEditRulesAdapter', () => {
  it('VALID: {} => returns PreEditLintConfig structure with rules array', () => {
    dungeonmasterEslintPluginGetPreEditRulesAdapterProxy();

    const result = dungeonmasterEslintPluginGetPreEditRulesAdapter();

    expect(Array.isArray(result.rules)).toBe(true);
    expect(result.rules.length).toBeGreaterThan(0);
    expect(typeof result.rules[0]).toBe('string');
  });
});
