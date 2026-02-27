/**
 * PURPOSE: Bans branching logic (if/switch/ternary) in startup files to enforce linear wiring
 *
 * USAGE:
 * const rule = ruleBanStartupBranchingBroker();
 * // Returns EslintRule that reports errors on if, switch, and ternary expressions in startup/ files
 *
 * WHEN-TO-USE: When registering ESLint rules to enforce that startup files contain only linear wiring
 */
import { eslintRuleContract } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintRule } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintContext } from '../../../contracts/eslint-context/eslint-context-contract';
import type { Tsestree } from '../../../contracts/tsestree/tsestree-contract';

export const ruleBanStartupBranchingBroker = (): EslintRule => ({
  ...eslintRuleContract.parse({
    meta: {
      type: 'problem',
      docs: {
        description:
          'Startup files must not contain branching logic (if/switch/ternary). Move this logic to a flow, responder, or broker.',
      },
      messages: {
        noBranching:
          'Startup files must not contain branching logic (if/switch/ternary). Move this logic to a flow, responder, or broker.',
      },
      schema: [],
    },
  }),
  create: (context: EslintContext) => {
    const ctx = context;
    const filename = ctx.filename ?? '';

    const isStartupFile = filename.includes('/startup/');

    if (!isStartupFile) {
      return {};
    }

    return {
      IfStatement: (node: Tsestree): void => {
        ctx.report({ node, messageId: 'noBranching' });
      },
      SwitchStatement: (node: Tsestree): void => {
        ctx.report({ node, messageId: 'noBranching' });
      },
      ConditionalExpression: (node: Tsestree): void => {
        ctx.report({ node, messageId: 'noBranching' });
      },
    };
  },
});
