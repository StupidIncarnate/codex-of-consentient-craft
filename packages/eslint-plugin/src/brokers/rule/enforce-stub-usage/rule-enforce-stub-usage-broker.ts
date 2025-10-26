import { eslintRuleContract } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintRule } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintContext } from '../../../contracts/eslint-context/eslint-context-contract';
import type { Tsestree } from '../../../contracts/tsestree/tsestree-contract';
import { hasFileSuffixGuard } from '../../../guards/has-file-suffix/has-file-suffix-guard';
import { typeNameFromAnnotationTransformer } from '../../../transformers/type-name-from-annotation/type-name-from-annotation-transformer';

export const ruleEnforceStubUsageBroker = (): EslintRule => ({
  ...eslintRuleContract.parse({
    meta: {
      type: 'problem',
      docs: {
        description:
          'Enforce using stub functions instead of inline typed object literals in test files',
      },
      messages: {
        useStubInsteadOfTypedLiteral:
          'Use stub function instead of inline typed object literal. Create or use existing stub for type "{{typeName}}".',
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

        // Check if variable has a type annotation
        if (!id || !id.typeAnnotation) {
          return;
        }

        // Check if init is an object expression or array expression
        const isObjectLiteral = init?.type === 'ObjectExpression';
        const isArrayLiteral = init?.type === 'ArrayExpression';

        if (!isObjectLiteral && !isArrayLiteral) {
          return;
        }

        // Extract type name from type annotation
        const typeName = typeNameFromAnnotationTransformer({
          typeAnnotation: id.typeAnnotation,
        });

        if (!typeName) {
          return;
        }

        // Report violation
        ctx.report({
          node: init ?? node,
          messageId: 'useStubInsteadOfTypedLiteral',
          data: { typeName: String(typeName) },
        });
      },
    };
  },
});
