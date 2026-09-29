/**
 * PURPOSE: Bans negated (.not) matcher usage in test files, enforcing positive expected value assertions
 *
 * USAGE:
 * const rule = ruleBanNegatedMatchersBroker();
 * // Returns ESLint rule that prevents expect().not.matcher() patterns
 *
 * WHEN-TO-USE: When registering ESLint rules to enforce positive assertions instead of negated checks
 */
import { eslintRuleContract } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintRule } from '../../../contracts/eslint-rule/eslint-rule-contract';
import { AST_NODE_TYPES } from '#gateway/npm/typescript-eslint__utils';
import type { TSESLint, TSESTree } from '#gateway/npm/typescript-eslint__utils';
import { isTestFileGuard } from '../../../guards/is-test-file/is-test-file-guard';
import { isSpecFileGuard } from '../../../guards/is-spec-file/is-spec-file-guard';
import { astFindExpectCallTransformer } from '../../../transformers/ast-find-expect-call/ast-find-expect-call-transformer';

export const ruleBanNegatedMatchersBroker = (): EslintRule => ({
  ...eslintRuleContract.parse({
    meta: {
      type: 'problem',
      docs: {
        description:
          'Ban .not.* matcher usage in test files. Assert the positive expected value instead.',
      },
      messages: {
        noNegatedMatcher:
          'Do not use .not.{{matcher}}(). Assert the actual expected value instead.',
      },
      schema: [],
    },
  }),
  create: (context: TSESLint.RuleContext<string, unknown[]>) => {
    const ctx = context;
    const { filename } = ctx;
    const isTestFile = isTestFileGuard({ filename });

    if (!isTestFile) {
      return {};
    }

    const isPlaywrightFile = isSpecFileGuard({ filename }) || filename.includes('.e2e.test.');

    const allowedPlaywrightNegatedMatchers = new Set([
      'toBeVisible',
      'toBeInTheDocument',
      'toBeEnabled',
      'toBeDisabled',
      'toBeChecked',
      'toBeEmpty',
      'toBeHidden',
      'toHaveCount',
    ]);

    return {
      CallExpression: (node: TSESTree.CallExpression): void => {
        const { callee } = node;

        if (callee.type !== AST_NODE_TYPES.MemberExpression) {
          return;
        }

        const matcherName =
          callee.property.type === AST_NODE_TYPES.Identifier ||
          callee.property.type === AST_NODE_TYPES.PrivateIdentifier
            ? callee.property.name
            : undefined;
        if (matcherName === undefined) {
          return;
        }

        // Check if the object is a .not member expression
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

        // In Playwright files, only allow specific visibility/state matchers with .not
        if (isPlaywrightFile && allowedPlaywrightNegatedMatchers.has(matcherName)) {
          return;
        }

        ctx.report({
          node,
          messageId: 'noNegatedMatcher',
          data: { matcher: matcherName },
        });
      },
    };
  },
});
