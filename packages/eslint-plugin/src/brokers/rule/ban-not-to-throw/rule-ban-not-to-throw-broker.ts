/**
 * PURPOSE: Bans .not.toThrow() assertions in test files — tests should assert actual return values or side effects
 *
 * USAGE:
 * const rule = ruleBanNotToThrowBroker();
 * // Returns ESLint rule that prevents expect().not.toThrow() pattern
 *
 * WHEN-TO-USE: When registering ESLint rules to enforce meaningful assertions instead of absence-of-error checks
 */
import { eslintRuleContract } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintRule } from '../../../contracts/eslint-rule/eslint-rule-contract';
import { AST_NODE_TYPES } from '#gateway/npm/typescript-eslint__utils';
import type { TSESLint, TSESTree } from '#gateway/npm/typescript-eslint__utils';
import { isTestFileGuard } from '../../../guards/is-test-file/is-test-file-guard';
import { astFindExpectCallTransformer } from '../../../transformers/ast-find-expect-call/ast-find-expect-call-transformer';

export const ruleBanNotToThrowBroker = (): EslintRule => ({
  ...eslintRuleContract.parse({
    meta: {
      type: 'problem',
      docs: {
        description:
          'Ban .not.toThrow() assertions in test files. Assert actual return values or side effects instead.',
      },
      messages: {
        noNotToThrow: 'Assert actual return value or side effects instead of .not.toThrow()',
      },
      schema: [],
    },
  }),
  create: (context: TSESLint.RuleContext<string, unknown[]>) => {
    const ctx = context;
    const isTestFile = isTestFileGuard({ filename: ctx.filename });

    if (!isTestFile) {
      return {};
    }

    return {
      CallExpression: (node: TSESTree.CallExpression): void => {
        const { callee } = node;

        if (callee.type !== AST_NODE_TYPES.MemberExpression) {
          return;
        }

        if (
          (callee.property.type === AST_NODE_TYPES.Identifier ||
          callee.property.type === AST_NODE_TYPES.PrivateIdentifier
            ? callee.property.name
            : undefined) !== 'toThrow'
        ) {
          return;
        }

        if (callee.object.type !== AST_NODE_TYPES.MemberExpression) {
          return;
        }

        if (
          (callee.object.property.type === AST_NODE_TYPES.Identifier ||
          callee.object.property.type === AST_NODE_TYPES.PrivateIdentifier
            ? callee.object.property.name
            : undefined) !== 'not'
        ) {
          return;
        }

        // Verify the chain originates from expect()
        const expectCall = astFindExpectCallTransformer({ node });
        if (expectCall === null) {
          return;
        }

        ctx.report({
          node,
          messageId: 'noNotToThrow',
        });
      },
    };
  },
});
