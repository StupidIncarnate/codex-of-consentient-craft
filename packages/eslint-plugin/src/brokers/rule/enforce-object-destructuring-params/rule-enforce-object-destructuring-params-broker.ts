import { eslintRuleContract } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintRule } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintContext } from '../../../contracts/eslint-context/eslint-context-contract';
import type { Tsestree } from '../../../contracts/tsestree/tsestree-contract';
import { validateFunctionParamsUseObjectDestructuringTransformer } from '../../../transformers/validate-function-params-use-object-destructuring/validate-function-params-use-object-destructuring-transformer';

/**
 * PURPOSE: Enforces that exported function parameters use object destructuring pattern
 *
 * USAGE:
 * const rule = ruleEnforceObjectDestructuringParamsBroker();
 * // Returns ESLint rule that requires `({ param }: { param: Type })` instead of `(param: Type)`
 */
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
  create: (context: EslintContext) => {
    const ctx = context;

    return {
      // Only check exported arrow functions: export const fn = () => {}
      'ExportNamedDeclaration > VariableDeclaration > VariableDeclarator > ArrowFunctionExpression':
        (node: Tsestree): void => {
          validateFunctionParamsUseObjectDestructuringTransformer({ node, context: ctx });
        },
      // Only check exported function declarations: export function fn() {}
      'ExportNamedDeclaration > FunctionDeclaration': (node: Tsestree): void => {
        validateFunctionParamsUseObjectDestructuringTransformer({ node, context: ctx });
      },
    };
  },
});
