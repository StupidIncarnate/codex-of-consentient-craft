/**
 * PURPOSE: Bans expect(x.includes(y)).toBe(true) pattern — use exact string assertions instead
 *
 * USAGE:
 * const rule = ruleBanStringIncludesInExpectBroker();
 * // Returns ESLint rule that prevents wrapping .includes() inside expect()
 *
 * WHEN-TO-USE: When registering ESLint rules to enforce exact string assertions over substring checks
 */
import { eslintRuleContract } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintRule } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintContext } from '../../../contracts/eslint-context/eslint-context-contract';
import type { Tsestree } from '../../../contracts/tsestree/tsestree-contract';
import { isTestFileGuard } from '../../../guards/is-test-file/is-test-file-guard';

export const ruleBanStringIncludesInExpectBroker = (): EslintRule => ({
  ...eslintRuleContract.parse({
    meta: {
      type: 'problem',
      docs: {
        description:
          'Ban expect(x.includes(y)).toBe(true) — use .toBe() or .toMatch(/^exact$/u) for full string assertions.',
      },
      messages: {
        noIncludesInExpect:
          'Do not use .includes() inside expect(). Assert the full string value with .toBe() or use anchored .toMatch(/^exact$/u).',
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

        // Check if this is expect(...)
        if (callee?.type !== 'Identifier' || callee.name !== 'expect') {
          return;
        }

        const firstArg = node.arguments?.[0];
        if (firstArg === null || firstArg === undefined) {
          return;
        }

        // Check if the argument is something.includes(...)
        if (firstArg.type !== 'CallExpression') {
          return;
        }

        const argCallee = firstArg.callee;
        if (argCallee?.type !== 'MemberExpression') {
          return;
        }

        if (argCallee.property?.name !== 'includes') {
          return;
        }

        ctx.report({
          node,
          messageId: 'noIncludesInExpect',
        });
      },
    };
  },
});
