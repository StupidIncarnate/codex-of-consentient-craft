import type { Rule } from '../../../adapters/eslint/eslint-rule-adapter';
import type { TSESTree } from '../../../adapters/typescript-eslint-utils/typescript-eslint-utils-tsestree';

export const explicitReturnTypesRuleBroker = (): Rule.RuleModule => ({
  meta: {
    type: 'problem',
    docs: {
      description: 'Require explicit return types on exported functions',
    },
    messages: {
      missingReturnType: 'Exported functions must have explicit return types',
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
