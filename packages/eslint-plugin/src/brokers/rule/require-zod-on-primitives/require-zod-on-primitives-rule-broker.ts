import type { Rule } from 'eslint';
import type { TSESTree } from '@typescript-eslint/utils';

export const requireZodOnPrimitivesRuleBroker = (): Rule.RuleModule => ({
  meta: {
    type: 'problem',
    docs: {
      description: 'Require .brand() chaining on z.string() and z.number() calls',
    },
    messages: {
      requireBrandString:
        "z.string() must be chained with .brand() - use z.string().email().brand<'EmailAddress'>() instead of z.string().email()",
      requireBrandNumber:
        "z.number() must be chained with .brand() - use z.number().positive().brand<'PositiveNumber'>() instead of z.number().positive()",
    },
    schema: [],
  },
  create: (context: Rule.RuleContext) => ({
    'CallExpression[callee.object.name="z"][callee.property.name="string"]:not(:has(MemberExpression[property.name="brand"]))':
      (node: TSESTree.Node): void => {
        context.report({
          node,
          messageId: 'requireBrandString',
        });
      },
    'CallExpression[callee.object.name="z"][callee.property.name="number"]:not(:has(MemberExpression[property.name="brand"]))':
      (node: TSESTree.Node): void => {
        context.report({
          node,
          messageId: 'requireBrandNumber',
        });
      },
  }),
});
