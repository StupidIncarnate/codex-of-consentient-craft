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
import { eslintRuleContract } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintRule } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintContext } from '../../../contracts/eslint-context/eslint-context-contract';
import type { Tsestree } from '../../../contracts/tsestree/tsestree-contract';

export const ruleBanRequireInSourceBroker = (): EslintRule => ({
  ...eslintRuleContract.parse({
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
  }),
  create: (context: EslintContext) => {
    const ctx = context;

    return {
      CallExpression: (node: Tsestree): void => {
        const { callee } = node;

        if (callee?.type !== 'Identifier') {
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
