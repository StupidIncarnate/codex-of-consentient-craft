/**
 * PURPOSE: Bans page.route() calls in Playwright e2e files to prevent intercepting server responses
 *
 * USAGE:
 * const rule = ruleBanPageRouteInE2eBroker();
 * // Returns ESLint rule that prevents page.route() in .e2e.ts files
 */
import { eslintRuleContract } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintRule } from '../../../contracts/eslint-rule/eslint-rule-contract';
import { AST_NODE_TYPES } from '#gateway/npm/typescript-eslint__utils';
import type { TSESLint, TSESTree } from '#gateway/npm/typescript-eslint__utils';
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
  create: (context: TSESLint.RuleContext<string, unknown[]>) => {
    const ctx = context;
    return {
      CallExpression: (node: TSESTree.CallExpression): void => {
        const isSpecFile = isSpecFileGuard({ filename: ctx.filename });

        if (!isSpecFile) {
          return;
        }

        const { callee } = node;

        const isPageRouteCall =
          callee.type === AST_NODE_TYPES.MemberExpression &&
          callee.object.type === AST_NODE_TYPES.Identifier &&
          callee.object.name === 'page' &&
          (callee.property.type === AST_NODE_TYPES.Identifier ||
            callee.property.type === AST_NODE_TYPES.PrivateIdentifier) &&
          callee.property.name === 'route';

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
