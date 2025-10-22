import { eslintRuleContract } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintRule } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintContext } from '../../../contracts/eslint-context/eslint-context-contract';
import type { Tsestree } from '../../../contracts/tsestree/tsestree-contract';

export const ruleExplicitReturnTypesBroker = (): EslintRule => ({
  ...eslintRuleContract.parse({
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
  }),
  create: (context: EslintContext) => {
    const ctx = context;
    return {
      'ExportNamedDeclaration > VariableDeclaration > VariableDeclarator[id.type="Identifier"] > ArrowFunctionExpression:not([returnType])':
        (node: Tsestree): void => {
          ctx.report({
            node,
            messageId: 'missingReturnType',
          });
        },
      'ExportNamedDeclaration > FunctionDeclaration:not([returnType])': (node: Tsestree): void => {
        ctx.report({
          node,
          messageId: 'missingReturnType',
        });
      },
      'ExportDefaultDeclaration > FunctionDeclaration:not([returnType])': (
        node: Tsestree,
      ): void => {
        ctx.report({
          node,
          messageId: 'missingReturnType',
        });
      },
      'ExportDefaultDeclaration > ArrowFunctionExpression:not([returnType])': (
        node: Tsestree,
      ): void => {
        ctx.report({
          node,
          messageId: 'missingReturnType',
        });
      },
    };
  },
});
