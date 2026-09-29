/**
 * PURPOSE: Bans silent .catch() handlers that swallow errors without logging, re-throwing, or taking action
 *
 * USAGE:
 * const rule = ruleBanSilentCatchBroker();
 * // Returns ESLint rule that prevents .catch(() => undefined), .catch(() => {}), and similar patterns
 */
import { eslintRuleContract } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintRule } from '../../../contracts/eslint-rule/eslint-rule-contract';
import { AST_NODE_TYPES } from '#gateway/npm/typescript-eslint__utils';
import type { TSESLint, TSESTree } from '#gateway/npm/typescript-eslint__utils';
import { isSilentBodyLayerBroker } from './is-silent-body-layer-broker';

export const ruleBanSilentCatchBroker = (): EslintRule => ({
  ...eslintRuleContract.parse({
    meta: {
      type: 'problem',
      docs: {
        description:
          'Ban silent .catch() handlers that swallow errors without logging, re-throwing, or taking action.',
      },
      messages: {
        banSilentCatch: 'Never silently consume errors. Always bubble them up.',
      },
      schema: [],
    },
  }),
  create: (context: TSESLint.RuleContext<string, unknown[]>) => {
    const ctx = context;

    return {
      CallExpression: (node: TSESTree.CallExpression): void => {
        const { callee } = node;

        // Must be .catch() — a MemberExpression with property name 'catch'
        if (callee.type !== AST_NODE_TYPES.MemberExpression) return;
        if (
          (callee.property.type === AST_NODE_TYPES.Identifier ||
          callee.property.type === AST_NODE_TYPES.PrivateIdentifier
            ? callee.property.name
            : undefined) !== 'catch'
        )
          return;

        // Must have at least one argument
        const args = node.arguments;

        if (args.length === 0) return;

        const [handler] = args;

        if (!handler) return;

        // Handler must be a function expression or arrow function
        if (
          handler.type !== AST_NODE_TYPES.ArrowFunctionExpression &&
          handler.type !== AST_NODE_TYPES.FunctionExpression
        ) {
          return;
        }

        // Check if the function body is silent
        if (isSilentBodyLayerBroker({ body: handler.body })) {
          ctx.report({
            node,
            messageId: 'banSilentCatch',
          });
        }
      },
    };
  },
});
