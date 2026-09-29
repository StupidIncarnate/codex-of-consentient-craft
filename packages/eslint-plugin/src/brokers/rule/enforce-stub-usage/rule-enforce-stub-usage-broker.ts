/**
 * PURPOSE: Creates ESLint rule that enforces using stub functions instead of inline object/array literals in test files
 *
 * USAGE:
 * const rule = ruleEnforceStubUsageBroker();
 * // Returns EslintRule that reports violations when test files use inline typed literals instead of stubs
 *
 * WHEN-TO-USE: When registering ESLint rules to ensure test files use reusable stub functions for consistency
 */
import { eslintRuleContract } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintRule } from '../../../contracts/eslint-rule/eslint-rule-contract';
import { AST_NODE_TYPES } from '#gateway/npm/typescript-eslint__utils';
import type { TSESLint, TSESTree } from '#gateway/npm/typescript-eslint__utils';
import { hasFileSuffixGuard } from '../../../guards/has-file-suffix/has-file-suffix-guard';
import { isAstObjectStubSpreadGuard } from '../../../guards/is-ast-object-stub-spread/is-ast-object-stub-spread-guard';
import { isGatewayFileGuard } from '../../../guards/is-gateway-file/is-gateway-file-guard';
import { typeNameFromAnnotationTransformer } from '../../../transformers/type-name-from-annotation/type-name-from-annotation-transformer';

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
  create: (context: TSESLint.RuleContext<string, unknown[]>) => {
    const ctx = context;
    const { filename } = ctx;

    // Only apply to test files
    if (!hasFileSuffixGuard({ filename, suffix: 'test' })) {
      return {};
    }

    // Skip the gateway: its tests build plain fixture objects mirroring the outside package's
    // own shape (a Node error, a stat result) — there is no contract-backed stub to reach for.
    if (isGatewayFileGuard({ filename })) {
      return {};
    }

    return {
      VariableDeclarator: (node: TSESTree.VariableDeclarator): void => {
        const { id, init } = node;

        // Unwrap TSAsExpression recursively (e.g., {} as unknown as Type)
        let actualInit = init;
        while (actualInit?.type === AST_NODE_TYPES.TSAsExpression) {
          actualInit = actualInit.expression;
        }

        const isObjectLiteral = actualInit?.type === AST_NODE_TYPES.ObjectExpression;
        const isArrayLiteral = actualInit?.type === AST_NODE_TYPES.ArrayExpression;

        if (!isObjectLiteral && !isArrayLiteral) {
          return;
        }

        // A clone built only from stub spreads IS stub usage. It is the way to reach shapes
        // a stub cannot return, such as dropping a required key to test contract rejection.
        if (actualInit && isAstObjectStubSpreadGuard({ node: actualInit })) {
          return;
        }

        // For arrays: only flag if they contain object literals
        if (isArrayLiteral && actualInit) {
          const hasObjectLiterals =
            actualInit.type === AST_NODE_TYPES.ArrayExpression ||
            actualInit.type === AST_NODE_TYPES.ArrayPattern
              ? actualInit.elements.some(
                  (element) => element?.type === AST_NODE_TYPES.ObjectExpression,
                )
              : undefined;

          if (!hasObjectLiterals) {
            return; // Array doesn't contain object literals, allow it
          }
        }

        // Extract type name from type annotation if available
        const annotation = id.typeAnnotation;
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
