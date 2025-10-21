import { eslintRuleContract } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintRule } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintContext } from '../../../contracts/eslint-context/eslint-context-contract';
import type { Tsestree } from '../../../contracts/tsestree/tsestree-contract';
import { hasFileSuffixGuard } from '../../../guards/has-file-suffix/has-file-suffix-guard';
import { isAstNodeExportedGuard } from '../../../guards/is-ast-node-exported/is-ast-node-exported-guard';
import { isAstParamSingleValuePropertyGuard } from '../../../guards/is-ast-param-single-value-property/is-ast-param-single-value-property-guard';
import { isAstParamSpreadOperatorGuard } from '../../../guards/is-ast-param-spread-operator/is-ast-param-spread-operator-guard';
import { isAstParamStubArgumentTypeGuard } from '../../../guards/is-ast-param-stub-argument-type/is-ast-param-stub-argument-type-guard';
import { isAstFunctionUsesContractParseGuard } from '../../../guards/is-ast-function-uses-contract-parse/is-ast-function-uses-contract-parse-guard';

export const ruleEnforceStubPatternsBroker = (): EslintRule => ({
  ...eslintRuleContract.parse({
    meta: {
      type: 'problem',
      docs: {
        description: 'Enforce stub function patterns: spread operator and StubArgument type',
      },
      messages: {
        useSpreadOperator:
          'Stub functions must use spread operator in parameters: ({ ...props }: StubArgument<Type> = {})',
        useStubArgumentType:
          'Stub functions must use StubArgument<Type> from @questmaestro/shared/@types',
        useContractParse:
          'Stub functions must return contract.parse() to validate and brand the output',
      },
      schema: [],
    },
  }),
  create: (context: unknown) => {
    const ctx = context as EslintContext;
    const filename = String(ctx.getFilename?.() ?? '');
    if (!hasFileSuffixGuard({ filename, suffix: 'stub' })) {
      return {};
    }

    return {
      ArrowFunctionExpression: (node: Tsestree): void => {
        // Only check root exported stub functions, not nested arrow functions
        if (!isAstNodeExportedGuard({ node })) {
          return;
        }

        // Skip nested arrow functions (arrow functions inside other functions)
        // Check if any parent is a function-like node before reaching the export
        let { parent } = node;
        while (parent !== undefined && parent !== null) {
          const { type } = parent;
          if (type === 'ExportNamedDeclaration' || type === 'ExportDefaultDeclaration') {
            break; // Reached export, this is a top-level export
          }
          if (
            type === 'ArrowFunctionExpression' ||
            type === 'FunctionExpression' ||
            type === 'FunctionDeclaration'
          ) {
            return; // This is a nested function, skip it
          }
          ({ parent } = parent);
        }

        if (!node.params || node.params.length === 0) {
          return;
        }

        const hasSpread = isAstParamSpreadOperatorGuard({ funcNode: node });
        const isSingleValue = isAstParamSingleValuePropertyGuard({ funcNode: node });
        const hasStubArgument = isAstParamStubArgumentTypeGuard({ funcNode: node });
        const hasContractParse = isAstFunctionUsesContractParseGuard({ funcNode: node });

        // Exception: Allow ({ value }: { value: string }) for branded string stubs
        if (isSingleValue) {
          // Still check contract.parse() for single value stubs
          if (!hasContractParse) {
            ctx.report({
              node,
              messageId: 'useContractParse',
            });
          }
          return; // Skip other checks for single value pattern
        }

        // Check if function has spread operator in parameters
        if (!hasSpread) {
          const [firstParam] = node.params;
          if (firstParam) {
            ctx.report({
              node: firstParam,
              messageId: 'useSpreadOperator',
            });
          }
          return; // Don't check other things if spread is missing
        }

        // If spread operator is present, check for StubArgument type
        if (!hasStubArgument) {
          const [firstParam] = node.params;
          if (firstParam) {
            ctx.report({
              node: firstParam,
              messageId: 'useStubArgumentType',
            });
          }
        }

        // Check if contract.parse() is used
        if (!hasContractParse) {
          ctx.report({
            node,
            messageId: 'useContractParse',
          });
        }
      },
    };
  },
});
