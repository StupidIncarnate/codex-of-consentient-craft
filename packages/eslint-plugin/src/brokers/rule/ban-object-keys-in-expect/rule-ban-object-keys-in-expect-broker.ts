/**
 * PURPOSE: Bans expect(Object.keys(...)) usage — assert full object shape instead of just keys
 *
 * USAGE:
 * const rule = ruleBanObjectKeysInExpectBroker();
 * // Returns ESLint rule that prevents Object.keys() inside expect()
 *
 * WHEN-TO-USE: When registering ESLint rules to enforce asserting both keys and values
 */
import { eslintRuleContract } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintRule } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintContext } from '../../../contracts/eslint-context/eslint-context-contract';
import type { Tsestree } from '../../../contracts/tsestree/tsestree-contract';
import { isTestFileGuard } from '../../../guards/is-test-file/is-test-file-guard';

export const ruleBanObjectKeysInExpectBroker = (): EslintRule => ({
  ...eslintRuleContract.parse({
    meta: {
      type: 'problem',
      docs: {
        description:
          'Ban expect(Object.keys(...)) — assert full object shape with .toStrictEqual() instead of just keys.',
      },
      messages: {
        noObjectKeysInExpect:
          'Do not use Object.keys() inside expect(). Assert the full object shape with .toStrictEqual() to verify both keys and values.',
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

        // Check if the argument is Object.keys(...)
        if (firstArg.type !== 'CallExpression') {
          return;
        }

        const argCallee = firstArg.callee;
        if (argCallee?.type !== 'MemberExpression') {
          return;
        }

        if (argCallee.object?.type !== 'Identifier' || argCallee.object.name !== 'Object') {
          return;
        }

        if (argCallee.property?.name !== 'keys') {
          return;
        }

        ctx.report({
          node,
          messageId: 'noObjectKeysInExpect',
        });
      },
    };
  },
});
