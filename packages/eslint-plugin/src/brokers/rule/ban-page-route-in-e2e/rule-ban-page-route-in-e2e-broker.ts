/**
 * PURPOSE: Bans page.route() calls in e2e spec files to prevent intercepting server responses
 *
 * USAGE:
 * const rule = ruleBanPageRouteInE2eBroker();
 * // Returns ESLint rule that prevents page.route() in .spec.ts files
 */
import { eslintRuleContract } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintRule } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintContext } from '../../../contracts/eslint-context/eslint-context-contract';
import type { Tsestree } from '../../../contracts/tsestree/tsestree-contract';
import { isSpecFileGuard } from '../../../guards/is-spec-file/is-spec-file-guard';

export const ruleBanPageRouteInE2eBroker = (): EslintRule => ({
  ...eslintRuleContract.parse({
    meta: {
      type: 'problem',
      docs: {
        description:
          'Ban page.route() in e2e spec files — intercepting server responses bypasses the real server and hides bugs.',
      },
      messages: {
        noPageRoute:
          'Do not use page.route() in e2e tests — intercepting server responses bypasses the real server and hides bugs. Use request.patch() or request.post() to drive real state instead.',
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

        const isPageRouteCall =
          callee?.type === 'MemberExpression' &&
          callee.object?.name === 'page' &&
          callee.property?.name === 'route';

        if (!isPageRouteCall) {
          return;
        }

        ctx.report({
          node,
          messageId: 'noPageRoute',
        });
      },
    };
  },
});
