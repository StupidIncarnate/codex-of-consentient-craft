/**
 * PURPOSE: Bans waitForTimeout() calls in e2e spec files to prevent flaky tests
 *
 * USAGE:
 * const rule = ruleBanWaitForTimeoutBroker();
 * // Returns ESLint rule that prevents waitForTimeout() in *.spec.ts files
 */
import { eslintRuleContract } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintRule } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintContext } from '../../../contracts/eslint-context/eslint-context-contract';
import type { Tsestree } from '../../../contracts/tsestree/tsestree-contract';
import { isSpecFileGuard } from '../../../guards/is-spec-file/is-spec-file-guard';

export const ruleBanWaitForTimeoutBroker = (): EslintRule => ({
  ...eslintRuleContract.parse({
    meta: {
      type: 'problem',
      docs: {
        description: 'Ban waitForTimeout() in e2e spec files to prevent flaky tests.',
      },
      messages: {
        noWaitForTimeout:
          'Do not use waitForTimeout() in e2e tests — it causes flaky tests. Wait for specific elements or events instead: await expect(locator).toBeVisible({timeout})',
      },
      schema: [],
    },
  }),
  create: (context: EslintContext) => {
    const ctx = context;
    return {
      CallExpression: (node: Tsestree): void => {
        const isSpecFile = isSpecFileGuard({ filename: ctx.filename ?? '' });

        if (!isSpecFile) {
          return;
        }

        const { callee } = node;

        const isWaitForTimeoutCall =
          callee?.type === 'MemberExpression' && callee.property?.name === 'waitForTimeout';

        if (!isWaitForTimeoutCall) {
          return;
        }

        ctx.report({
          node,
          messageId: 'noWaitForTimeout',
        });
      },
    };
  },
});
