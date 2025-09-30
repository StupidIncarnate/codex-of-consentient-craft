import type { Rule } from 'eslint';
import type { TSESTree } from '@typescript-eslint/utils';

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
    'TSStringKeyword, TSNumberKeyword': (node: TSESTree.Node): void => {
      const typeName = node.type === 'TSStringKeyword' ? 'string' : 'number';
      const suggestion =
        typeName === 'string'
          ? 'EmailAddress, UserName, FilePath, etc.'
          : 'Currency, PositiveNumber, Age, etc.';

      context.report({
        node,
        messageId: 'banPrimitive',
        data: {
          typeName,
          suggestion,
        },
      });
    },
  }),
});
