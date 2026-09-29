/**
 * PURPOSE: Enforces that exported function parameters use object destructuring pattern
 *
 * USAGE:
 * const rule = ruleEnforceObjectDestructuringParamsBroker();
 * // Returns ESLint rule that requires `({ param }: { param: Type })` instead of `(param: Type)`
 */
import type { TSESLint, TSESTree } from '#gateway/npm/typescript-eslint__utils';
import { validateFunctionParamsUseObjectDestructuringTransformer } from '../../../transformers/validate-function-params-use-object-destructuring/validate-function-params-use-object-destructuring-transformer';

export const ruleEnforceObjectDestructuringParamsBroker =
  (): TSESLint.RuleModule<'useObjectDestructuring'> => ({
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
    defaultOptions: [],
    create: (context: TSESLint.RuleContext<string, unknown[]>) => {
      const ctx = context;

      return {
        // Only check exported arrow functions: export const fn = () => {}
        'ExportNamedDeclaration > VariableDeclaration > VariableDeclarator > ArrowFunctionExpression':
          (node: TSESTree.ArrowFunctionExpression): void => {
            validateFunctionParamsUseObjectDestructuringTransformer({ node, context: ctx });
          },
        // Only check exported function declarations: export function fn() {}
        'ExportNamedDeclaration > FunctionDeclaration': (
          node: TSESTree.FunctionDeclaration,
        ): void => {
          validateFunctionParamsUseObjectDestructuringTransformer({ node, context: ctx });
        },
      };
    },
  });
