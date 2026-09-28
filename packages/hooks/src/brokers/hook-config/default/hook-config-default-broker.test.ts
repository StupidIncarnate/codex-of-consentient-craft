import { dungeonmasterRuleEnforceOnStatics } from '@dungeonmaster/shared/statics';
import { preEditRuleNamesExtractTransformer } from '@dungeonmaster/shared/transformers';
import { hookConfigDefaultBroker } from './hook-config-default-broker';
import { hookConfigDefaultBrokerProxy } from './hook-config-default-broker.proxy';

describe('hookConfigDefaultBroker', () => {
  it('VALID: {} => returns PreEditLintConfig with pre-edit rules from plugin', () => {
    hookConfigDefaultBrokerProxy();

    const expectedRules = preEditRuleNamesExtractTransformer({
      enforceOn: dungeonmasterRuleEnforceOnStatics,
    });

    const result = hookConfigDefaultBroker();

    expect(result).toStrictEqual({ rules: expectedRules });
    expect(result.rules.length).toBeGreaterThan(30);
  });
});
