import type { AstNode } from '../../../contracts/ast-node/ast-node-contract';

export const explicitReturnTypesRuleBroker = () => ({
  meta: {
    type: 'problem' as const,
    docs: {
      description: 'Require explicit return types on exported functions using Zod contracts',
    },
  },
  create: (context: { report: (violation: { node: unknown; message: string }) => void }) => ({
    'ExportNamedDeclaration > VariableDeclaration > VariableDeclarator[id.type="Identifier"] > ArrowFunctionExpression:not([returnType])':
      (node: AstNode) => {
        context.report({
          node,
          message: 'Exported functions must have explicit return types using Zod contracts',
        });
      },
    'ExportNamedDeclaration > FunctionDeclaration:not([returnType])': (node: AstNode) => {
      context.report({
        node,
        message: 'Exported functions must have explicit return types using Zod contracts',
      });
    },
    'ExportDefaultDeclaration > FunctionDeclaration:not([returnType])': (node: AstNode) => {
      context.report({
        node,
        message: 'Exported functions must have explicit return types using Zod contracts',
      });
    },
    'ExportDefaultDeclaration > ArrowFunctionExpression:not([returnType])': (node: AstNode) => {
      context.report({
        node,
        message: 'Exported functions must have explicit return types using Zod contracts',
      });
    },
  }),
});
