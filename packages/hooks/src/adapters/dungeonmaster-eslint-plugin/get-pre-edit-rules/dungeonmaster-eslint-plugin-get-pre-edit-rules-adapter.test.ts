import { dungeonmasterEslintPluginGetPreEditRulesAdapter } from './dungeonmaster-eslint-plugin-get-pre-edit-rules-adapter';
import { dungeonmasterEslintPluginGetPreEditRulesAdapterProxy } from './dungeonmaster-eslint-plugin-get-pre-edit-rules-adapter.proxy';
import { dungeonmasterRuleEnforceOnStatics } from '@dungeonmaster/shared/statics';

describe('dungeonmasterEslintPluginGetPreEditRulesAdapter', () => {
  it('VALID: {} => returns PreEditLintConfig structure with rules array', () => {
    dungeonmasterEslintPluginGetPreEditRulesAdapterProxy();

    const expectedRules = Object.entries(dungeonmasterRuleEnforceOnStatics)
      .filter(([_ruleName, timing]) => timing === 'pre-edit')
      .map(([ruleName]) => ruleName);

    const result = dungeonmasterEslintPluginGetPreEditRulesAdapter();

    expect(result).toStrictEqual({
      rules: expectedRules,
    });
  });
});
