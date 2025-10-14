import { eslintRuleContract } from './eslint-rule-contract';
import type { EslintRule } from './eslint-rule-contract';

export const EslintRuleStub = (props: Partial<EslintRule> = {}): EslintRule => {
  const baseRule = {
    meta: {
      type: 'problem' as const,
      docs: {
        description:
          eslintRuleContract.shape.meta.shape.docs.shape.description.parse('Test rule description'),
        category: eslintRuleContract.shape.meta.shape.docs.shape.category.parse('Possible Errors'),
        recommended: false,
      },
      fixable: undefined,
      schema: [],
      messages: {},
    },
    create: () => ({}),
  };

  return eslintRuleContract.parse({
    ...baseRule,
    ...props,
  });
};
