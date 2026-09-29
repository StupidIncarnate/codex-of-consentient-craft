/**
 * PURPOSE: Bans .evaluate() with getComputedStyle in Playwright spec files — use toHaveCSS() instead
 *
 * USAGE:
 * const rule = ruleBanPlaywrightEvaluateForStylesBroker();
 *
 * WHEN-TO-USE: When registering ESLint rules to enforce Playwright auto-retrying assertions for CSS checks
 */
import { AST_NODE_TYPES } from '#gateway/npm/typescript-eslint__utils';
import type { TSESLint, TSESTree } from '#gateway/npm/typescript-eslint__utils';
import { isSpecFileGuard } from '../../../guards/is-spec-file/is-spec-file-guard';

export const ruleBanPlaywrightEvaluateForStylesBroker =
  (): TSESLint.RuleModule<'noEvaluateForStyles'> => ({
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
    defaultOptions: [],
    create: (context: TSESLint.RuleContext<string, unknown[]>) => {
      const ctx = context;
      return {
        CallExpression: (node: TSESTree.CallExpression): void => {
          const isSpecFile = isSpecFileGuard({ filename: ctx.filename });

          if (!isSpecFile) {
            return;
          }

          const { callee } = node;

          const isEvaluateCall =
            callee.type === AST_NODE_TYPES.MemberExpression &&
            (callee.property.type === AST_NODE_TYPES.Identifier ||
              callee.property.type === AST_NODE_TYPES.PrivateIdentifier) &&
            callee.property.name === 'evaluate';

          if (!isEvaluateCall) {
            return;
          }

          const [firstArg] = node.arguments;

          if (firstArg?.type !== AST_NODE_TYPES.ArrowFunctionExpression) {
            return;
          }

          const { body } = firstArg;

          // body can be a single node or array — only check expression bodies (single node)

          // Handle expression body: (e) => getComputedStyle(e).color
          // body is a MemberExpression whose object is a CallExpression
          const hasGetComputedStyleDirect =
            body.type === AST_NODE_TYPES.MemberExpression &&
            body.object.type === AST_NODE_TYPES.CallExpression &&
            body.object.callee.type === AST_NODE_TYPES.Identifier &&
            body.object.callee.name === 'getComputedStyle';

          // Handle window.getComputedStyle: (e) => window.getComputedStyle(e).color
          const hasWindowGetComputedStyle =
            body.type === AST_NODE_TYPES.MemberExpression &&
            body.object.type === AST_NODE_TYPES.CallExpression &&
            body.object.callee.type === AST_NODE_TYPES.MemberExpression &&
            (body.object.callee.property.type === AST_NODE_TYPES.Identifier ||
              body.object.callee.property.type === AST_NODE_TYPES.PrivateIdentifier) &&
            body.object.callee.property.name === 'getComputedStyle';

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
