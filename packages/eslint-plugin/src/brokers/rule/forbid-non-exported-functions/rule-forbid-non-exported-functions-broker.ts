/**
 * PURPOSE: Creates ESLint rule that forbids non-exported functions and nested functions to prevent hidden helper functions
 *
 * USAGE:
 * const rule = ruleForbidNonExportedFunctionsBroker();
 * // Returns EslintRule that enforces all functions must be the primary export of their file
 *
 * WHEN-TO-USE: When registering ESLint rules to enforce architectural pattern where each function gets its own file
 * WHEN-NOT-TO-USE: Does not apply to test, stub, or proxy files which are automatically excluded
 */
import { eslintRuleContract } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintRule } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintContext } from '../../../contracts/eslint-context/eslint-context-contract';
import type { Tsestree } from '../../../contracts/tsestree/tsestree-contract';
import { shouldExcludeFileFromProjectStructureRulesGuard } from '../../../guards/should-exclude-file-from-project-structure-rules/should-exclude-file-from-project-structure-rules-guard';
import { isAstNodeInsideFunctionGuard } from '../../../guards/is-ast-node-inside-function/is-ast-node-inside-function-guard';
import { isAstNodeExportedGuard } from '../../../guards/is-ast-node-exported/is-ast-node-exported-guard';
import { astFunctionTypeTransformer } from '../../../transformers/ast-function-type/ast-function-type-transformer';
import { functionViolationSuggestionTransformer } from '../../../transformers/function-violation-suggestion/function-violation-suggestion-transformer';
import { hasFileSuffixGuard } from '../../../guards/has-file-suffix/has-file-suffix-guard';

export const ruleForbidNonExportedFunctionsBroker = (): EslintRule => ({
  ...eslintRuleContract.parse({
    meta: {
      type: 'problem',
      docs: {
        description:
          'Forbid non-exported functions and nested functions to prevent hidden helper functions',
      },
      messages: {
        nonExportedFunction:
          'Non-exported functions are forbidden. All functions must be the primary export of their file. {{suggestion}}',
        nestedFunction:
          'Nested functions are forbidden. Functions cannot be declared inside other functions. {{suggestion}}',
      },
      schema: [],
    },
  }),
  create: (context: EslintContext) => {
    const ctx = context;
    const filename = ctx.filename ?? '';

    // Exclude test/stub files
    if (shouldExcludeFileFromProjectStructureRulesGuard({ filename })) {
      return {};
    }

    // Exclude proxy files - they need nested functions for create-per-test pattern
    if (hasFileSuffixGuard({ filename, suffix: 'proxy' })) {
      return {};
    }

    return {
      // Catch non-exported arrow functions: const foo = () => {}
      'VariableDeclarator > ArrowFunctionExpression': (node: Tsestree): void => {
        // Check if it's inside a function (nested)
        if (isAstNodeInsideFunctionGuard({ node })) {
          const functionType = astFunctionTypeTransformer({ node });
          const suggestion = functionViolationSuggestionTransformer({ functionType });
          ctx.report({
            node,
            messageId: 'nestedFunction',
            data: { suggestion },
          });
          return;
        }

        // Check if it's exported at module level
        if (!isAstNodeExportedGuard({ node })) {
          const functionType = astFunctionTypeTransformer({ node });
          const suggestion = functionViolationSuggestionTransformer({ functionType });
          ctx.report({
            node,
            messageId: 'nonExportedFunction',
            data: { suggestion },
          });
        }
      },

      // Catch non-exported function declarations: function foo() {}
      FunctionDeclaration: (node: Tsestree): void => {
        // Check if it's inside a function (nested)
        if (isAstNodeInsideFunctionGuard({ node })) {
          ctx.report({
            node,
            messageId: 'nestedFunction',
            data: {
              suggestion: functionViolationSuggestionTransformer({ functionType: 'unknown' }),
            },
          });
          return;
        }

        // Check if it's exported at module level
        if (!isAstNodeExportedGuard({ node })) {
          ctx.report({
            node,
            messageId: 'nonExportedFunction',
            data: {
              suggestion: functionViolationSuggestionTransformer({ functionType: 'unknown' }),
            },
          });
        }
      },

      // Catch nested function expressions: const foo = function() {}
      FunctionExpression: (node: Tsestree): void => {
        if (isAstNodeInsideFunctionGuard({ node })) {
          ctx.report({
            node,
            messageId: 'nestedFunction',
            data: {
              suggestion: functionViolationSuggestionTransformer({ functionType: 'unknown' }),
            },
          });
        }
      },
    };
  },
});
