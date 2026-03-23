/**
 * PURPOSE: Bans arbitrary delay patterns in e2e spec files to prevent flaky tests
 *
 * USAGE:
 * const rule = ruleBanWaitForTimeoutBroker();
 * // Returns ESLint rule that prevents waitForTimeout() and setTimeout() delays in *.spec.ts files
 */
import { eslintRuleContract } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintRule } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintContext } from '../../../contracts/eslint-context/eslint-context-contract';
import type { Tsestree } from '../../../contracts/tsestree/tsestree-contract';
import { isSpecFileGuard } from '../../../guards/is-spec-file/is-spec-file-guard';
import { isIntegrationTestFileGuard } from '../../../guards/is-integration-test-file/is-integration-test-file-guard';
import { filePathContract } from '@dungeonmaster/shared/contracts';

export const ruleBanWaitForTimeoutBroker = (): EslintRule => ({
  ...eslintRuleContract.parse({
    meta: {
      type: 'problem',
      docs: {
        description:
          'Ban arbitrary delay patterns (waitForTimeout, setTimeout) in e2e and integration test files to prevent flaky tests.',
      },
      messages: {
        noWaitForTimeout:
          'Do not use waitForTimeout() in e2e tests — it causes flaky tests. Wait for specific elements or events instead: await expect(locator).toBeVisible({timeout})',
        noSetTimeout:
          "Do not use setTimeout() or test.setTimeout() in tests — arbitrary delays cause flaky tests. Use the testing framework's built-in wait mechanisms instead: await expect(locator).toBeVisible({timeout})",
      },
      schema: [],
    },
  }),
  create: (context: EslintContext) => {
    const ctx = context;
    const filename = ctx.filename ?? '';
    const isSpec = isSpecFileGuard({ filename });
    const isIntegration = isIntegrationTestFileGuard({
      filePath: filePathContract.parse(filename),
    });

    if (!isSpec && !isIntegration) {
      return {};
    }

    // Track whether we're inside a page.evaluate() callback — setTimeout inside
    // browser-evaluated code is a different concern (runs in the browser, not the test)
    let pageEvaluateDepth = 0;

    return {
      CallExpression: (node: Tsestree): void => {
        const { callee } = node;

        if (!callee) return;

        // Track page.evaluate() entry
        if (callee.type === 'MemberExpression' && callee.property?.name === 'evaluate') {
          pageEvaluateDepth += 1;
        }

        // Ban .waitForTimeout() calls
        if (callee.type === 'MemberExpression' && callee.property?.name === 'waitForTimeout') {
          ctx.report({
            node,
            messageId: 'noWaitForTimeout',
          });
          return;
        }

        // Ban setTimeout() calls — but NOT test.setTimeout() (Playwright timeout config)
        // and NOT inside page.evaluate() (browser-side code)
        if (pageEvaluateDepth > 0) {
          return;
        }

        const isBareSetTimeout = callee.type === 'Identifier' && callee.name === 'setTimeout';

        const isGlobalSetTimeout =
          callee.type === 'MemberExpression' &&
          callee.object?.name === 'globalThis' &&
          callee.property?.name === 'setTimeout';

        const isTestSetTimeout =
          callee.type === 'MemberExpression' &&
          callee.object?.name === 'test' &&
          callee.property?.name === 'setTimeout';

        if (isBareSetTimeout || isGlobalSetTimeout || isTestSetTimeout) {
          ctx.report({
            node,
            messageId: 'noSetTimeout',
          });
        }
      },

      'CallExpression:exit': (node: Tsestree): void => {
        const { callee } = node;

        if (!callee) return;

        if (callee.type === 'MemberExpression' && callee.property?.name === 'evaluate') {
          pageEvaluateDepth -= 1;
        }
      },
    };
  },
});
