import { eslintRuleNameFromPathTransformer } from './eslint-rule-name-from-path-transformer';

describe('eslintRuleNameFromPathTransformer', () => {
  it('VALID: {ban-primitives broker path} => returns ban-primitives', () => {
    const result = eslintRuleNameFromPathTransformer({
      filePath:
        '/repo/packages/eslint-plugin/src/brokers/rule/ban-primitives/rule-ban-primitives-broker.ts',
    });

    expect(result).toStrictEqual('ban-primitives');
  });

  it('VALID: {enforce-project-structure broker path} => returns enforce-project-structure', () => {
    const result = eslintRuleNameFromPathTransformer({
      filePath:
        '/repo/packages/eslint-plugin/src/brokers/rule/enforce-project-structure/rule-enforce-project-structure-broker.ts',
    });

    expect(result).toStrictEqual('enforce-project-structure');
  });
});
