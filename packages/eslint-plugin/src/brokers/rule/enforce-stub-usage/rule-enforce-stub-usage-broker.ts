import { eslintRuleContract } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintRule } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintContext } from '../../../contracts/eslint-context/eslint-context-contract';
import type { Tsestree } from '../../../contracts/tsestree/tsestree-contract';
import { hasFileSuffixGuard } from '../../../guards/has-file-suffix/has-file-suffix-guard';
import { typeNameFromAnnotationTransformer } from '../../../transformers/type-name-from-annotation/type-name-from-annotation-transformer';

/**
 * PURPOSE: Creates ESLint rule that enforces using stub functions instead of inline object/array literals in test files
 *
 * USAGE:
 * const rule = ruleEnforceStubUsageBroker();
 * // Returns EslintRule that reports violations when test files use inline typed literals instead of stubs
 *
 * WHEN-TO-USE: When registering ESLint rules to ensure test files use reusable stub functions for consistency
 */
export const ruleEnforceStubUsageBroker = (): EslintRule => ({
  ...eslintRuleContract.parse({
    meta: {
      type: 'problem',
      docs: {
        description:
          'Enforce using stub functions instead of inline object/array literals in test files',
      },
      messages: {
        useStubInsteadOfTypedLiteral:
          'Use stub function instead of inline object/array literal. Create or use existing stub for type "{{typeName}}".',
      },
      schema: [],
    },
  }),
  create: (context: EslintContext) => {
    const ctx = context;
    const filename = String(ctx.getFilename?.() ?? '');

    // Only apply to test files
    if (!hasFileSuffixGuard({ filename, suffix: 'test' })) {
      return {};
    }

    return {
      VariableDeclarator: (node: Tsestree): void => {
        const { id, init } = node;

        // Unwrap TSAsExpression recursively (e.g., {} as unknown as Type)
        let actualInit = init;
        while (actualInit?.type === 'TSAsExpression') {
          actualInit = actualInit.expression;
        }

        const isObjectLiteral = actualInit?.type === 'ObjectExpression';
        const isArrayLiteral = actualInit?.type === 'ArrayExpression';

        if (!isObjectLiteral && !isArrayLiteral) {
          return;
        }

        // For arrays: only flag if they contain object literals
        if (isArrayLiteral && actualInit) {
          const hasObjectLiterals = actualInit.elements?.some(
            (element) => element?.type === 'ObjectExpression',
          );

          if (!hasObjectLiterals) {
            return; // Array doesn't contain object literals, allow it
          }
        }

        // Extract type name from type annotation if available
        const annotation = id?.typeAnnotation;
        const typeName = annotation
          ? typeNameFromAnnotationTransformer({ typeAnnotation: annotation })
          : null;
        const finalTypeName = typeName ?? (isArrayLiteral ? 'Array' : 'Object');

        // Report violation
        ctx.report({
          node: actualInit ?? node,
          messageId: 'useStubInsteadOfTypedLiteral',
          data: { typeName: String(finalTypeName) },
        });
      },
    };
  },
});
