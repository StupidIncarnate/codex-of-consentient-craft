import type { Rule } from '../../../adapters/eslint/eslint-rule-adapter';
import type { TSESTree } from '../../../adapters/typescript-eslint-utils/typescript-eslint-utils-tsestree';
import { shouldExcludeFileFromProjectStructureRulesGuard } from '../../../guards/should-exclude-file-from-project-structure-rules/should-exclude-file-from-project-structure-rules-guard';
import { isAstNodeInsideFunctionGuard } from '../../../guards/is-ast-node-inside-function/is-ast-node-inside-function-guard';
import { isAstNodeExportedGuard } from '../../../guards/is-ast-node-exported/is-ast-node-exported-guard';
import { astFunctionTypeTransformer } from '../../../transformers/ast-function-type/ast-function-type-transformer';
import { functionViolationSuggestionTransformer } from '../../../transformers/function-violation-suggestion/function-violation-suggestion-transformer';

export const forbidNonExportedFunctionsRuleBroker = (): Rule.RuleModule => ({
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
  create: (context: Rule.RuleContext) => {
    const { filename } = context;

    // Exclude test/stub files
    if (shouldExcludeFileFromProjectStructureRulesGuard({ filename })) {
      return {};
    }

    return {
      // Catch non-exported arrow functions: const foo = () => {}
      'VariableDeclarator > ArrowFunctionExpression': (node): void => {
        const astNode = node as unknown as TSESTree.Node;

        // Check if it's inside a function (nested)
        if (isAstNodeInsideFunctionGuard({ node: astNode })) {
          const functionType = astFunctionTypeTransformer({ node: astNode });
          const suggestion = functionViolationSuggestionTransformer({ functionType });
          context.report({
            node,
            messageId: 'nestedFunction',
            data: { suggestion },
          });
          return;
        }

        // Check if it's exported at module level
        if (!isAstNodeExportedGuard({ node: astNode })) {
          const functionType = astFunctionTypeTransformer({ node: astNode });
          const suggestion = functionViolationSuggestionTransformer({ functionType });
          context.report({
            node,
            messageId: 'nonExportedFunction',
            data: { suggestion },
          });
        }
      },

      // Catch non-exported function declarations: function foo() {}
      FunctionDeclaration: (node): void => {
        const astNode = node as unknown as TSESTree.Node;

        // Check if it's inside a function (nested)
        if (isAstNodeInsideFunctionGuard({ node: astNode })) {
          context.report({
            node,
            messageId: 'nestedFunction',
            data: {
              suggestion: functionViolationSuggestionTransformer({ functionType: 'unknown' }),
            },
          });
          return;
        }

        // Check if it's exported at module level
        if (!isAstNodeExportedGuard({ node: astNode })) {
          context.report({
            node,
            messageId: 'nonExportedFunction',
            data: {
              suggestion: functionViolationSuggestionTransformer({ functionType: 'unknown' }),
            },
          });
        }
      },

      // Catch nested function expressions: const foo = function() {}
      FunctionExpression: (node): void => {
        const astNode = node as unknown as TSESTree.Node;

        if (isAstNodeInsideFunctionGuard({ node: astNode })) {
          context.report({
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
