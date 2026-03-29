/**
 * PURPOSE: Bans .evaluate() with getComputedStyle in Playwright spec files — use toHaveCSS() instead
 *
 * USAGE:
 * const rule = ruleBanPlaywrightEvaluateForStylesBroker();
 *
 * WHEN-TO-USE: When registering ESLint rules to enforce Playwright auto-retrying assertions for CSS checks
 */
import { eslintRuleContract } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintRule } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintContext } from '../../../contracts/eslint-context/eslint-context-contract';
import type { Tsestree } from '../../../contracts/tsestree/tsestree-contract';
import { isSpecFileGuard } from '../../../guards/is-spec-file/is-spec-file-guard';

export const ruleBanPlaywrightEvaluateForStylesBroker = (): EslintRule => ({
  ...eslintRuleContract.parse({
    meta: {
      type: 'problem',
      docs: {
        description:
          'Ban .evaluate() with getComputedStyle in Playwright spec files — use toHaveCSS() instead.',
      },
      messages: {
        noEvaluateForStyles:
          "Use await expect(locator).toHaveCSS('property', 'value') instead of .evaluate() with getComputedStyle",
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

        const isEvaluateCall =
          callee?.type === 'MemberExpression' && callee.property?.name === 'evaluate';

        if (!isEvaluateCall) {
          return;
        }

        const firstArg = node.arguments?.[0];

        if (firstArg?.type !== 'ArrowFunctionExpression') {
          return;
        }

        const { body } = firstArg;

        // body can be a single node or array — only check expression bodies (single node)
        if (body === undefined || body === null || Array.isArray(body)) {
          return;
        }

        // Handle expression body: (e) => getComputedStyle(e).color
        // body is a MemberExpression whose object is a CallExpression
        const hasGetComputedStyleDirect =
          body.type === 'MemberExpression' &&
          body.object?.type === 'CallExpression' &&
          body.object.callee?.name === 'getComputedStyle';

        // Handle window.getComputedStyle: (e) => window.getComputedStyle(e).color
        const hasWindowGetComputedStyle =
          body.type === 'MemberExpression' &&
          body.object?.type === 'CallExpression' &&
          body.object.callee?.type === 'MemberExpression' &&
          body.object.callee.property?.name === 'getComputedStyle';

        if (!hasGetComputedStyleDirect && !hasWindowGetComputedStyle) {
          return;
        }

        ctx.report({
          node,
          messageId: 'noEvaluateForStyles',
        });
      },
    };
  },
});
