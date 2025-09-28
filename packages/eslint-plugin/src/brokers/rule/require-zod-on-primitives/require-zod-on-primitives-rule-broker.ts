import type { AstNode } from '../../../contracts/ast-node/ast-node-contract';

export const requireZodOnPrimitivesRuleBroker = () => ({
  meta: {
    type: 'problem' as const,
    docs: {
      description: 'Require .brand() chaining on z.string() and z.number() calls',
    },
  },
  create: (context: { report: (violation: { node: unknown; message: string }) => void }) => ({
    'CallExpression[callee.object.name="z"][callee.property.name="string"]:not(:has(MemberExpression[property.name="brand"]))':
      (node: AstNode) => {
        context.report({
          node,
          message:
            "z.string() must be chained with .brand() - use z.string().email().brand<'EmailAddress'>() instead of z.string().email()",
        });
      },
    'CallExpression[callee.object.name="z"][callee.property.name="number"]:not(:has(MemberExpression[property.name="brand"]))':
      (node: AstNode) => {
        context.report({
          node,
          message:
            "z.number() must be chained with .brand() - use z.number().positive().brand<'PositiveNumber'>() instead of z.number().positive()",
        });
      },
  }),
});
