import { eslintRuleContract } from './eslint-rule-contract';
import type { EslintRule } from './eslint-rule-contract';
import type { StubArgument } from '@dungeonmaster/shared/@types';

export const EslintRuleStub = ({ ...props }: StubArgument<EslintRule> = {}): EslintRule => {
  // Separate function props from data props
  const { create, ...dataProps } = props;

  // Return: validated data + functions (preserved references)
  return {
    // Data properties validated through contract
    ...eslintRuleContract.parse({
      meta: {
        type: 'problem',
        docs: {
          description: 'Test rule description',
          category: 'Possible Errors',
          recommended: false,
        },
        fixable: undefined,
        schema: [],
        messages: {},
      },
      ...dataProps,
    }),
    // Function properties preserved (not parsed to maintain references)
    create: create ?? ((): Record<string, (node: unknown) => void> => ({})),
  };
};
