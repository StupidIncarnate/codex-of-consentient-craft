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
import type { EslintContext } from '../../../contracts/eslint-context/eslint-context-contract';
import type { Tsestree } from '../../../contracts/tsestree/tsestree-contract';
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
  create: (context: EslintContext) => {
    const ctx = context;
    const filename = ctx.filename ?? '';
    const isTestFile = isTestFileGuard({ filename });

    if (!isTestFile) {
      return {};
    }

    const isPlaywrightFile = isSpecFileGuard({ filename }) || filename.includes('.e2e.test.');

    if (isPlaywrightFile) {
      return {};
    }

    return {
      CallExpression: (node: Tsestree): void => {
        const { callee } = node;

        if (callee?.type !== 'MemberExpression') {
          return;
        }

        const matcherName = callee.property?.name;
        if (matcherName === undefined) {
          return;
        }

        // Check if the object is a .not member expression
        if (callee.object?.type !== 'MemberExpression') {
          return;
        }

        if (callee.object.property?.name !== 'not') {
          return;
        }

        // Verify the chain originates from expect()
        const expectCall = astFindExpectCallTransformer({ node });
        if (expectCall === null) {
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
