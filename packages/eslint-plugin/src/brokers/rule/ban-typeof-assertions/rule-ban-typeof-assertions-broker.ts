/**
 * PURPOSE: Bans typeof assertions in test files — tests should assert actual values, not just types
 *
 * USAGE:
 * const rule = ruleBanTypeofAssertionsBroker();
 * // Returns ESLint rule that prevents expect(typeof x).toBe('string') patterns
 *
 * WHEN-TO-USE: When registering ESLint rules to enforce value-level assertions over type-level checks
 */
import { eslintRuleContract } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintRule } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintContext } from '../../../contracts/eslint-context/eslint-context-contract';
import type { Tsestree } from '../../../contracts/tsestree/tsestree-contract';
import { isTestFileGuard } from '../../../guards/is-test-file/is-test-file-guard';
import { astFindExpectCallTransformer } from '../../../transformers/ast-find-expect-call/ast-find-expect-call-transformer';

export const ruleBanTypeofAssertionsBroker = (): EslintRule => ({
  ...eslintRuleContract.parse({
    meta: {
      type: 'problem',
      docs: {
        description:
          'Ban typeof assertions in test files. Tests should assert actual values, not just types.',
      },
      messages: {
        noTypeofAssertion:
          'Assert actual value instead of checking typeof. typeof checks verify type but not content — use .toBe(), .toStrictEqual(), or .toMatch() with the expected value',
      },
      schema: [],
    },
  }),
  create: (context: EslintContext) => {
    const ctx = context;
    return {
      CallExpression: (node: Tsestree): void => {
        const isTestFile = isTestFileGuard({ filename: ctx.filename ?? '' });

        if (!isTestFile) {
          return;
        }

        const expectCall = astFindExpectCallTransformer({ node });

        if (expectCall === null) {
          return;
        }

        const firstArg = expectCall.arguments?.[0];

        if (firstArg?.type === 'UnaryExpression' && firstArg.operator === 'typeof') {
          ctx.report({
            node,
            messageId: 'noTypeofAssertion',
          });
        }
      },
    };
  },
});
