/**
 * PURPOSE: Bans tautological assertions where expect(X).toBe(X) with identical literals
 *
 * USAGE:
 * const rule = ruleBanTautologicalAssertionsBroker();
 * // Returns ESLint rule that prevents expect(true).toBe(true) and similar tautologies
 *
 * WHEN-TO-USE: When registering ESLint rules to prevent assertions that always pass
 */
import { eslintRuleContract } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintRule } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintContext } from '../../../contracts/eslint-context/eslint-context-contract';
import type { Tsestree } from '../../../contracts/tsestree/tsestree-contract';
import { isTestFileGuard } from '../../../guards/is-test-file/is-test-file-guard';
import { astFindExpectCallTransformer } from '../../../transformers/ast-find-expect-call/ast-find-expect-call-transformer';
import { tautologyLiteralKeyTransformer } from '../../../transformers/tautology-literal-key/tautology-literal-key-transformer';

export const ruleBanTautologicalAssertionsBroker = (): EslintRule => ({
  ...eslintRuleContract.parse({
    meta: {
      type: 'problem',
      docs: {
        description:
          'Ban tautological assertions like expect(true).toBe(true) where both sides are identical literals.',
      },
      messages: {
        tautologicalAssertion:
          'Tautological assertion: expect({{value}}).toBe({{value}}) always passes. Assert on actual function return values or side effects instead.',
      },
      schema: [],
    },
  }),
  create: (context: EslintContext) => {
    const ctx = context;
    const isTestFile = isTestFileGuard({ filename: ctx.filename ?? '' });

    if (!isTestFile) {
      return {};
    }

    return {
      CallExpression: (node: Tsestree): void => {
        const { callee } = node;

        if (callee?.type !== 'MemberExpression') {
          return;
        }

        if (callee.property?.name !== 'toBe') {
          return;
        }

        // Verify the chain originates from expect()
        const expectCall = astFindExpectCallTransformer({ node });
        if (expectCall === null) {
          return;
        }

        // Get the expect() argument
        const expectArg = expectCall.arguments?.[0];
        if (expectArg === null || expectArg === undefined) {
          return;
        }

        // Get the toBe() argument
        const toBeArg = node.arguments?.[0];
        if (toBeArg === null || toBeArg === undefined) {
          return;
        }

        const expectKey = tautologyLiteralKeyTransformer({ node: expectArg });
        const toBeKey = tautologyLiteralKeyTransformer({ node: toBeArg });

        if (expectKey === null || toBeKey === null) {
          return;
        }

        if (expectKey === toBeKey) {
          ctx.report({
            node,
            messageId: 'tautologicalAssertion',
            data: {
              value:
                typeof expectArg.value === 'string' ||
                typeof expectArg.value === 'number' ||
                typeof expectArg.value === 'boolean'
                  ? String(expectArg.value)
                  : typeof expectArg.name === 'string'
                    ? expectArg.name
                    : expectKey,
            },
          });
        }
      },
    };
  },
});
