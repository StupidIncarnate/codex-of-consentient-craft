import type { AstNode } from '../../../contracts/ast-node/ast-node-contract';

export const banPrimitivesRuleBroker = () => ({
  meta: {
    type: 'problem' as const,
    docs: {
      description: 'Ban raw string and number types in favor of Zod contract types',
    },
  },
  create: (context: { report: (violation: { node: unknown; message: string }) => void }) => ({
    'TSStringKeyword, TSNumberKeyword': (node: AstNode) => {
      const typeName = node.type === 'TSStringKeyword' ? 'string' : 'number';
      const suggestion =
        typeName === 'string'
          ? 'EmailAddress, UserName, FilePath, etc.'
          : 'Currency, PositiveNumber, Age, etc.';

      context.report({
        node,
        message: `Raw ${typeName} type is not allowed. Use Zod contract types like ${suggestion} instead.`,
      });
    },
  }),
});
