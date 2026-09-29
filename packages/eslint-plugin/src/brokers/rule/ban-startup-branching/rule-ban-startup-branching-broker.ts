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
import type { TSESLint, TSESTree } from '#gateway/npm/typescript-eslint__utils';
import { isImplementationFileGuard } from '../../../guards/is-implementation-file/is-implementation-file-guard';

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
          "Startup files must not contain branching logic (if/switch/ternary). Move to a flow, responder, or broker. See 'No Branching Logic' in type-startup standards.",
        noLogicalBranching:
          "Startup files must not use logical expressions (&&/||) as control flow. Move conditional logic to a flow or responder. Self-invocation guards (require.main === module) belong in the entry file (bin/index.ts). See 'No Branching Logic' in type-startup standards.",
      },
      schema: [],
    },
  }),
  create: (context: TSESLint.RuleContext<string, unknown[]>) => {
    const ctx = context;
    const { filename } = ctx;

    const isStartupFile = filename.includes('/startup/');

    if (!isStartupFile || !isImplementationFileGuard({ filename })) {
      return {};
    }

    return {
      IfStatement: (node: TSESTree.IfStatement): void => {
        ctx.report({ node, messageId: 'noBranching' });
      },
      SwitchStatement: (node: TSESTree.SwitchStatement): void => {
        ctx.report({ node, messageId: 'noBranching' });
      },
      ConditionalExpression: (node: TSESTree.ConditionalExpression): void => {
        ctx.report({ node, messageId: 'noBranching' });
      },
      'ExpressionStatement[expression.type="LogicalExpression"]': (
        node: TSESTree.ExpressionStatement,
      ): void => {
        ctx.report({ node, messageId: 'noLogicalBranching' });
      },
    };
  },
});
