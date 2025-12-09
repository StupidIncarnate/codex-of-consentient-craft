import { dungeonmasterRuleEnforceOnStatics } from './dungeonmaster-rule-enforce-on-statics';

describe('dungeonmasterRuleEnforceOnStatics', () => {
  it('VALID: {} => contains pre-edit rules', () => {
    expect(dungeonmasterRuleEnforceOnStatics['@dungeonmaster/ban-primitives']).toBe('pre-edit');
    expect(
      dungeonmasterRuleEnforceOnStatics['@dungeonmaster/enforce-object-destructuring-params'],
    ).toBe('pre-edit');
    expect(dungeonmasterRuleEnforceOnStatics['@dungeonmaster/require-contract-validation']).toBe(
      'pre-edit',
    );
    expect(dungeonmasterRuleEnforceOnStatics['@typescript-eslint/no-explicit-any']).toBe(
      'pre-edit',
    );
    expect(dungeonmasterRuleEnforceOnStatics['eslint-comments/no-use']).toBe('pre-edit');
  });

  it('VALID: {} => contains post-edit rules', () => {
    expect(dungeonmasterRuleEnforceOnStatics['@dungeonmaster/enforce-proxy-patterns']).toBe(
      'post-edit',
    );
    expect(dungeonmasterRuleEnforceOnStatics['@dungeonmaster/enforce-proxy-child-creation']).toBe(
      'post-edit',
    );
    expect(
      dungeonmasterRuleEnforceOnStatics['@dungeonmaster/enforce-implementation-colocation'],
    ).toBe('post-edit');
    expect(dungeonmasterRuleEnforceOnStatics['@dungeonmaster/enforce-test-colocation']).toBe(
      'post-edit',
    );
  });

  it('VALID: {} => contains all 39 rules (35 pre-edit + 4 post-edit)', () => {
    const ruleCount = Object.keys(dungeonmasterRuleEnforceOnStatics).length;

    expect(ruleCount).toBe(39);
  });

  it('VALID: {} => pre-edit rules count is 35', () => {
    const preEditRules = Object.values(dungeonmasterRuleEnforceOnStatics).filter((timing) => {
      return timing === 'pre-edit';
    });

    expect(preEditRules).toHaveLength(35);
  });

  it('VALID: {} => post-edit rules count is 4', () => {
    const postEditRules = Object.values(dungeonmasterRuleEnforceOnStatics).filter((timing) => {
      return timing === 'post-edit';
    });

    expect(postEditRules).toHaveLength(4);
  });
});
