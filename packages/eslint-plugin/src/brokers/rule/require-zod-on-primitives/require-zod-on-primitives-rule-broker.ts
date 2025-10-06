import type { Rule } from '../../../adapters/eslint/eslint-rule-adapter';
import type { TSESTree } from '../../../adapters/typescript-eslint-utils/typescript-eslint-utils-tsestree';

const hasBrandInChain = (node: TSESTree.Node): boolean => {
  let current = node.parent;

  while (current) {
    if ('property' in current && 'name' in current.property && current.property.name === 'brand') {
      return true;
    }
    current = current.parent;
  }

  return false;
};

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
    'CallExpression[callee.object.name="z"][callee.property.name="string"]': (
      node: TSESTree.Node,
    ): void => {
      if (!hasBrandInChain(node)) {
        context.report({
          node,
          messageId: 'requireBrandString',
        });
      }
    },
    'CallExpression[callee.object.name="z"][callee.property.name="number"]': (
      node: TSESTree.Node,
    ): void => {
      if (!hasBrandInChain(node)) {
        context.report({
          node,
          messageId: 'requireBrandNumber',
        });
      }
    },
  }),
});
