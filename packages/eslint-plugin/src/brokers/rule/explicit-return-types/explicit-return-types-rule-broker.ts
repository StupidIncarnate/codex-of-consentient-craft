import type { Rule } from 'eslint';
import type { TSESTree } from '@typescript-eslint/utils';

export const explicitReturnTypesRuleBroker = (): Rule.RuleModule => ({
  meta: {
    type: 'problem',
    docs: {
      description: 'Require explicit return types on exported functions using Zod contracts',
    },
    messages: {
      missingReturnType: 'Exported functions must have explicit return types using Zod contracts',
    },
    schema: [],
  },
  create: (context: Rule.RuleContext) => ({
    'ExportNamedDeclaration > VariableDeclaration > VariableDeclarator[id.type="Identifier"] > ArrowFunctionExpression:not([returnType])':
      (node: TSESTree.Node): void => {
        context.report({
          node,
          messageId: 'missingReturnType',
        });
      },
    'ExportNamedDeclaration > FunctionDeclaration:not([returnType])': (
      node: TSESTree.Node,
    ): void => {
      context.report({
        node,
        messageId: 'missingReturnType',
      });
    },
    'ExportDefaultDeclaration > FunctionDeclaration:not([returnType])': (
      node: TSESTree.Node,
    ): void => {
      context.report({
        node,
        messageId: 'missingReturnType',
      });
    },
    'ExportDefaultDeclaration > ArrowFunctionExpression:not([returnType])': (
      node: TSESTree.Node,
    ): void => {
      context.report({
        node,
        messageId: 'missingReturnType',
      });
    },
  }),
});
