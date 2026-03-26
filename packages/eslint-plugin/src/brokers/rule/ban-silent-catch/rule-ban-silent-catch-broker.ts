/**
 * PURPOSE: Bans silent .catch() handlers that swallow errors without logging, re-throwing, or taking action
 *
 * USAGE:
 * const rule = ruleBanSilentCatchBroker();
 * // Returns ESLint rule that prevents .catch(() => undefined), .catch(() => {}), and similar patterns
 */
import { eslintRuleContract } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintRule } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintContext } from '../../../contracts/eslint-context/eslint-context-contract';
import type { Tsestree } from '../../../contracts/tsestree/tsestree-contract';
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
  create: (context: EslintContext) => {
    const ctx = context;

    return {
      CallExpression: (node: Tsestree): void => {
        const { callee } = node;

        if (!callee) return;

        // Must be .catch() — a MemberExpression with property name 'catch'
        if (callee.type !== 'MemberExpression') return;
        if (callee.property?.name !== 'catch') return;

        // Must have at least one argument
        const args = node.arguments;

        if (!args || args.length === 0) return;

        const [handler] = args;

        if (!handler) return;

        // Handler must be a function expression or arrow function
        if (handler.type !== 'ArrowFunctionExpression' && handler.type !== 'FunctionExpression') {
          return;
        }

        // Check if the function body is silent
        // body is a single node for arrow/function expressions (never an array at runtime)
        const handlerBody = Array.isArray(handler.body) ? handler.body[0] : handler.body;

        if (isSilentBodyLayerBroker({ body: handlerBody })) {
          ctx.report({
            node,
            messageId: 'banSilentCatch',
          });
        }
      },
    };
  },
});
