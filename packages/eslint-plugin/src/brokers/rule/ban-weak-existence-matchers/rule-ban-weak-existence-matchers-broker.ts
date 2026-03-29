/**
 * PURPOSE: Bans weak existence matchers (toBeUndefined, toBeNull, toBeDefined, toBeTruthy, toBeFalsy) in test files
 *
 * USAGE:
 * const rule = ruleBanWeakExistenceMatchersBroker();
 * // Returns ESLint rule that enforces explicit value assertions
 *
 * WHEN-TO-USE: When registering ESLint rules to prevent weak assertions that hide bugs
 */
import { eslintRuleContract } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintRule } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintContext } from '../../../contracts/eslint-context/eslint-context-contract';
import type { Tsestree } from '../../../contracts/tsestree/tsestree-contract';
import { isTestFileGuard } from '../../../guards/is-test-file/is-test-file-guard';
import { astFindExpectCallTransformer } from '../../../transformers/ast-find-expect-call/ast-find-expect-call-transformer';

const bannedMatchers = {
  toBeUndefined: '.toBe(undefined)',
  toBeNull: '.toBe(null)',
  toBeDefined: 'explicit value assertion',
  toBeTruthy: '.toBe(true)',
  toBeFalsy: '.toBe(false)',
} as const;

const bannedMatcherNames = Object.keys(bannedMatchers);

export const ruleBanWeakExistenceMatchersBroker = (): EslintRule => ({
  ...eslintRuleContract.parse({
    meta: {
      type: 'problem',
      docs: {
        description:
          'Ban weak existence matchers in test files. Use explicit value assertions instead.',
      },
      messages: {
        weakMatcher: 'Use {{replacement}} instead of .{{matcher}}()',
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

        const { callee } = node;

        if (callee?.type !== 'MemberExpression') {
          return;
        }

        const matcherName = callee.property?.name;

        if (matcherName === undefined || !bannedMatcherNames.includes(matcherName)) {
          return;
        }

        const expectNode = astFindExpectCallTransformer({ node });

        if (expectNode === null) {
          return;
        }

        ctx.report({
          node,
          messageId: 'weakMatcher',
          data: {
            matcher: matcherName,
            replacement: bannedMatchers[matcherName as keyof typeof bannedMatchers],
          },
        });
      },
    };
  },
});
