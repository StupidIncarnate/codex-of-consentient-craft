import { questmaestroRuleEnforceOnStatics } from './questmaestro-rule-enforce-on-statics';

describe('questmaestroRuleEnforceOnStatics', () => {
  it('VALID: {} => contains pre-edit rules', () => {
    expect(questmaestroRuleEnforceOnStatics['@questmaestro/ban-primitives']).toBe('pre-edit');
    expect(
      questmaestroRuleEnforceOnStatics['@questmaestro/enforce-object-destructuring-params'],
    ).toBe('pre-edit');
    expect(questmaestroRuleEnforceOnStatics['@questmaestro/require-contract-validation']).toBe(
      'pre-edit',
    );
    expect(questmaestroRuleEnforceOnStatics['@typescript-eslint/no-explicit-any']).toBe('pre-edit');
    expect(questmaestroRuleEnforceOnStatics['eslint-comments/no-use']).toBe('pre-edit');
  });

  it('VALID: {} => contains post-edit rules', () => {
    expect(questmaestroRuleEnforceOnStatics['@questmaestro/enforce-proxy-patterns']).toBe(
      'post-edit',
    );
    expect(questmaestroRuleEnforceOnStatics['@questmaestro/enforce-proxy-child-creation']).toBe(
      'post-edit',
    );
    expect(
      questmaestroRuleEnforceOnStatics['@questmaestro/enforce-implementation-colocation'],
    ).toBe('post-edit');
    expect(questmaestroRuleEnforceOnStatics['@questmaestro/enforce-test-colocation']).toBe(
      'post-edit',
    );
  });

  it('VALID: {} => contains all 39 rules (35 pre-edit + 4 post-edit)', () => {
    const ruleCount = Object.keys(questmaestroRuleEnforceOnStatics).length;

    expect(ruleCount).toBe(39);
  });

  it('VALID: {} => pre-edit rules count is 35', () => {
    const preEditRules = Object.values(questmaestroRuleEnforceOnStatics).filter((timing) => {
      return timing === 'pre-edit';
    });

    expect(preEditRules).toHaveLength(35);
  });

  it('VALID: {} => post-edit rules count is 4', () => {
    const postEditRules = Object.values(questmaestroRuleEnforceOnStatics).filter((timing) => {
      return timing === 'post-edit';
    });

    expect(postEditRules).toHaveLength(4);
  });
});
