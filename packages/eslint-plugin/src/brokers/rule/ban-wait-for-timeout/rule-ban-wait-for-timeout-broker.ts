/**
 * PURPOSE: Bans arbitrary delay patterns in e2e spec files to prevent flaky tests
 *
 * USAGE:
 * const rule = ruleBanWaitForTimeoutBroker();
 * // Returns ESLint rule that prevents waitForTimeout() and setTimeout() delays in *.e2e.ts files
 */
import { AST_NODE_TYPES } from '#gateway/npm/typescript-eslint__utils';
import type { TSESLint, TSESTree } from '#gateway/npm/typescript-eslint__utils';
import { isSpecFileGuard } from '../../../guards/is-spec-file/is-spec-file-guard';
import { isIntegrationTestFileGuard } from '../../../guards/is-integration-test-file/is-integration-test-file-guard';

export const ruleBanWaitForTimeoutBroker = (): TSESLint.RuleModule<
  'noWaitForTimeout' | 'noSetTimeout'
> => ({
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
  defaultOptions: [],
  create: (context: TSESLint.RuleContext<string, unknown[]>) => {
    const ctx = context;
    const { filename } = ctx;
    const isSpec = isSpecFileGuard({ filename });
    const isIntegration = isIntegrationTestFileGuard({
      filePath: filename,
    });

    if (!isSpec && !isIntegration) {
      return {};
    }

    // Track whether we're inside a page.evaluate() callback — setTimeout inside
    // browser-evaluated code is a different concern (runs in the browser, not the test)
    let pageEvaluateDepth = 0;

    return {
      CallExpression: (node: TSESTree.CallExpression): void => {
        const { callee } = node;

        // Track page.evaluate() entry
        if (
          callee.type === AST_NODE_TYPES.MemberExpression &&
          (callee.property.type === AST_NODE_TYPES.Identifier ||
            callee.property.type === AST_NODE_TYPES.PrivateIdentifier) &&
          callee.property.name === 'evaluate'
        ) {
          pageEvaluateDepth += 1;
        }

        // Ban .waitForTimeout() calls
        if (
          callee.type === AST_NODE_TYPES.MemberExpression &&
          (callee.property.type === AST_NODE_TYPES.Identifier ||
            callee.property.type === AST_NODE_TYPES.PrivateIdentifier) &&
          callee.property.name === 'waitForTimeout'
        ) {
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

        const isBareSetTimeout =
          callee.type === AST_NODE_TYPES.Identifier && callee.name === 'setTimeout';

        const isGlobalSetTimeout =
          callee.type === AST_NODE_TYPES.MemberExpression &&
          callee.object.type === AST_NODE_TYPES.Identifier &&
          callee.object.name === 'globalThis' &&
          (callee.property.type === AST_NODE_TYPES.Identifier ||
            callee.property.type === AST_NODE_TYPES.PrivateIdentifier) &&
          callee.property.name === 'setTimeout';

        const isTestSetTimeout =
          callee.type === AST_NODE_TYPES.MemberExpression &&
          callee.object.type === AST_NODE_TYPES.Identifier &&
          callee.object.name === 'test' &&
          (callee.property.type === AST_NODE_TYPES.Identifier ||
            callee.property.type === AST_NODE_TYPES.PrivateIdentifier) &&
          callee.property.name === 'setTimeout';

        if (isBareSetTimeout || isGlobalSetTimeout || isTestSetTimeout) {
          ctx.report({
            node,
            messageId: 'noSetTimeout',
          });
        }
      },

      'CallExpression:exit': (node: TSESTree.CallExpression): void => {
        const { callee } = node;

        if (
          callee.type === AST_NODE_TYPES.MemberExpression &&
          (callee.property.type === AST_NODE_TYPES.Identifier ||
            callee.property.type === AST_NODE_TYPES.PrivateIdentifier) &&
          callee.property.name === 'evaluate'
        ) {
          pageEvaluateDepth -= 1;
        }
      },
    };
  },
});
