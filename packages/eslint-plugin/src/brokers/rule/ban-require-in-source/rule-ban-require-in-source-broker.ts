/**
 * PURPOSE: Bans raw `require(...)` calls in source/test files; use `import` or `requireActual` instead
 *
 * USAGE:
 * const rule = ruleBanRequireInSourceBroker();
 * // Returns ESLint rule that flags any CallExpression whose callee is the identifier `require`
 *
 * WHEN-TO-USE: When registering ESLint rules to forbid CommonJS `require()` in TypeScript source.
 * `requireActual({ module: '...' })` from @dungeonmaster/testing/register-mock is allowed because
 * its callee identifier is `requireActual`, not `require`.
 */
import { AST_NODE_TYPES } from '#gateway/npm/typescript-eslint__utils';
import type { TSESLint, TSESTree } from '#gateway/npm/typescript-eslint__utils';

export const ruleBanRequireInSourceBroker = (): TSESLint.RuleModule<'noRequire'> => ({
  meta: {
    type: 'problem',
    docs: {
      description:
        'Ban raw require(...) calls in source files. Use ES `import` for modules and `requireActual` for test mock setup.',
    },
    messages: {
      noRequire:
        'Raw require(...) is not allowed. Use ES `import` for modules, or `requireActual({ module: "..." })` from @dungeonmaster/testing/register-mock in test setup.',
    },
    schema: [],
  },
  defaultOptions: [],
  create: (context: TSESLint.RuleContext<string, unknown[]>) => {
    const ctx = context;

    return {
      CallExpression: (node: TSESTree.CallExpression): void => {
        const { callee } = node;

        if (callee.type !== AST_NODE_TYPES.Identifier) {
          return;
        }

        if (callee.name !== 'require') {
          return;
        }

        ctx.report({
          node,
          messageId: 'noRequire',
        });
      },
    };
  },
});
