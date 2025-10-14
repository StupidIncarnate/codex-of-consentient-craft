import { eslintRuleContract } from './eslint-rule-contract';
import type { EslintRule } from './eslint-rule-contract';
import type { StubArgument } from '@questmaestro/shared/@types';

export const EslintRuleStub = ({ ...props }: StubArgument<EslintRule> = {}): EslintRule => {
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
