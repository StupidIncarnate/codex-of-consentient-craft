import { eslintRuleContract } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintRule } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintContext } from '../../../contracts/eslint-context/eslint-context-contract';
import type { Tsestree } from '../../../contracts/tsestree/tsestree-contract';

export const ruleEnforceObjectDestructuringParamsBroker = (): EslintRule => ({
  ...eslintRuleContract.parse({
    meta: {
      type: 'problem',
      docs: {
        description: 'Enforce object destructuring for function parameters',
      },
      messages: {
        useObjectDestructuring:
          'Function parameters must use object destructuring pattern: ({ param }: { param: Type })',
      },
      schema: [],
    },
  }),
  create: (context: unknown) => {
    const ctx = context as EslintContext;
    let functionDepth = 0;

    return {
      ArrowFunctionExpression: (node: Tsestree): void => {
        functionDepth++;
        if (functionDepth === 1) {
          // No params is fine, max-params rule will catch multiple params
          if (!node.params || node.params.length === 0 || node.params.length > 1) {
            return;
          }

          const [firstParam] = node.params;
          if (!firstParam) {
            return;
          }

          // Skip callback functions passed to library methods
          // e.g., .refine((x) => ...), .map((x) => ...), .filter((x) => ...)
          if (node.parent?.type === 'CallExpression') {
            return;
          }

          // Check if parameter uses object destructuring
          const isObjectDestructuring =
            firstParam.type === 'ObjectPattern' ||
            (firstParam.type === 'AssignmentPattern' && firstParam.left?.type === 'ObjectPattern');

          if (!isObjectDestructuring) {
            ctx.report({
              node: firstParam,
              messageId: 'useObjectDestructuring',
            });
          }
        }
      },
      'ArrowFunctionExpression:exit': (): void => {
        functionDepth--;
      },
      FunctionDeclaration: (node: Tsestree): void => {
        functionDepth++;
        if (functionDepth === 1) {
          // No params is fine, max-params rule will catch multiple params
          if (!node.params || node.params.length === 0 || node.params.length > 1) {
            return;
          }

          const [firstParam] = node.params;
          if (!firstParam) {
            return;
          }

          // Skip callback functions passed to library methods
          if (node.parent?.type === 'CallExpression') {
            return;
          }

          // Check if parameter uses object destructuring
          const isObjectDestructuring =
            firstParam.type === 'ObjectPattern' ||
            (firstParam.type === 'AssignmentPattern' && firstParam.left?.type === 'ObjectPattern');

          if (!isObjectDestructuring) {
            ctx.report({
              node: firstParam,
              messageId: 'useObjectDestructuring',
            });
          }
        }
      },
      'FunctionDeclaration:exit': (): void => {
        functionDepth--;
      },
      FunctionExpression: (node: Tsestree): void => {
        functionDepth++;
        if (functionDepth === 1) {
          // No params is fine, max-params rule will catch multiple params
          if (!node.params || node.params.length === 0 || node.params.length > 1) {
            return;
          }

          const [firstParam] = node.params;
          if (!firstParam) {
            return;
          }

          // Skip callback functions passed to library methods
          if (node.parent?.type === 'CallExpression') {
            return;
          }

          // Check if parameter uses object destructuring
          const isObjectDestructuring =
            firstParam.type === 'ObjectPattern' ||
            (firstParam.type === 'AssignmentPattern' && firstParam.left?.type === 'ObjectPattern');

          if (!isObjectDestructuring) {
            ctx.report({
              node: firstParam,
              messageId: 'useObjectDestructuring',
            });
          }
        }
      },
      'FunctionExpression:exit': (): void => {
        functionDepth--;
      },
    };
  },
});
