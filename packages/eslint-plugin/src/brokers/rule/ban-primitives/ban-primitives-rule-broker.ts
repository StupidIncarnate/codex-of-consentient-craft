import type { Rule } from '../../../adapters/eslint/eslint-rule-adapter';
import type { TSESTree } from '../../../adapters/typescript-eslint-utils/typescript-eslint-utils-tsestree';

export const banPrimitivesRuleBroker = (): Rule.RuleModule => ({
  meta: {
    type: 'problem',
    docs: {
      description: 'Ban raw string and number types in favor of Zod contract types',
    },
    messages: {
      banPrimitive:
        'Raw {{typeName}} type is not allowed. Use Zod contract types like {{suggestion}} instead.',
    },
    schema: [],
  },
  create: (context: Rule.RuleContext) => ({
    TSStringKeyword: (node: TSESTree.Node): void => {
      context.report({
        node,
        messageId: 'banPrimitive',
        data: {
          typeName: 'string',
          suggestion: 'EmailAddress, UserName, FilePath, etc.',
        },
      });
    },
    TSNumberKeyword: (node: TSESTree.Node): void => {
      context.report({
        node,
        messageId: 'banPrimitive',
        data: {
          typeName: 'number',
          suggestion: 'Currency, PositiveNumber, Age, etc.',
        },
      });
    },
  }),
});
