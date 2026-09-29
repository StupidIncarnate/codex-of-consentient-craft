/**
 * PURPOSE: Creates ESLint rule that enforces stub function patterns (spread operator, StubArgument type, and contract.parse())
 *
 * USAGE:
 * const rule = ruleEnforceStubPatternsBroker();
 * // Returns RuleModule that validates stub files use proper patterns
 *
 * A stub that imports every `-contract` file as a type only is a test double for a types-only contract
 * (a function type or method set Zod cannot check); it has no schema to parse, so `useContractParse`
 * does not apply to it.
 *
 * WHEN-TO-USE: When registering ESLint rules in the plugin startup to enforce stub function coding standards
 */
import { AST_NODE_TYPES } from '#gateway/npm/typescript-eslint__utils';
import type { TSESLint, TSESTree } from '#gateway/npm/typescript-eslint__utils';
import { hasFileSuffixGuard } from '../../../guards/has-file-suffix/has-file-suffix-guard';
import { isAstNodeExportedGuard } from '../../../guards/is-ast-node-exported/is-ast-node-exported-guard';
import { isAstParamSingleValuePropertyGuard } from '../../../guards/is-ast-param-single-value-property/is-ast-param-single-value-property-guard';
import { isAstParamSpreadOperatorGuard } from '../../../guards/is-ast-param-spread-operator/is-ast-param-spread-operator-guard';
import { isAstParamStubArgumentTypeGuard } from '../../../guards/is-ast-param-stub-argument-type/is-ast-param-stub-argument-type-guard';
import { isAstFunctionUsesContractParseGuard } from '../../../guards/is-ast-function-uses-contract-parse/is-ast-function-uses-contract-parse-guard';

export const ruleEnforceStubPatternsBroker = (): TSESLint.RuleModule<
  'useSpreadOperator' | 'useStubArgumentType' | 'useContractParse'
> => ({
  meta: {
    type: 'problem',
    docs: {
      description: 'Enforce stub function patterns: spread operator and StubArgument type',
    },
    messages: {
      useSpreadOperator:
        'Stub functions must use spread operator in parameters: ({ ...props }: StubArgument<Type> = {})',
      useStubArgumentType:
        'Stub functions must use StubArgument<Type> from @dungeonmaster/shared/@types',
      useContractParse:
        'Stub functions must return contract.parse() to validate and brand the output',
    },
    schema: [],
  },
  defaultOptions: [],
  create: (context: TSESLint.RuleContext<string, unknown[]>) => {
    const ctx = context;
    const { filename } = ctx;
    if (!hasFileSuffixGuard({ filename, suffix: 'stub' })) {
      return {};
    }

    let importsContractsAsTypesOnly = false;

    return {
      Program: (node: TSESTree.Program): void => {
        const contractImports = node.body.filter(
          (statement): statement is TSESTree.ImportDeclaration =>
            statement.type === AST_NODE_TYPES.ImportDeclaration &&
            statement.source.value.endsWith('-contract'),
        );
        importsContractsAsTypesOnly =
          contractImports.length > 0 &&
          contractImports.every(
            (statement) =>
              statement.importKind === 'type' ||
              (statement.specifiers.length > 0 &&
                statement.specifiers.every(
                  (specifier) =>
                    specifier.type === AST_NODE_TYPES.ImportSpecifier &&
                    specifier.importKind === 'type',
                )),
          );
      },
      ArrowFunctionExpression: (node: TSESTree.ArrowFunctionExpression): void => {
        // Only check root exported stub functions, not nested arrow functions
        if (!isAstNodeExportedGuard({ node })) {
          return;
        }

        // Skip nested arrow functions (arrow functions inside other functions)
        // Check if any parent is a function-like node before reaching the export
        let parent: TSESTree.Node | undefined = node.parent;
        while (parent) {
          const { type } = parent;
          if (
            type === AST_NODE_TYPES.ExportNamedDeclaration ||
            type === AST_NODE_TYPES.ExportDefaultDeclaration
          ) {
            break; // Reached export, this is a top-level export
          }
          if (
            type === AST_NODE_TYPES.ArrowFunctionExpression ||
            type === AST_NODE_TYPES.FunctionExpression ||
            type === AST_NODE_TYPES.FunctionDeclaration
          ) {
            return; // This is a nested function, skip it
          }
          ({ parent } = parent);
        }

        if (node.params.length === 0) {
          return;
        }

        const hasSpread = isAstParamSpreadOperatorGuard({ funcNode: node });
        const isSingleValue = isAstParamSingleValuePropertyGuard({ funcNode: node });
        const hasStubArgument = isAstParamStubArgumentTypeGuard({ funcNode: node });
        const hasContractParse =
          importsContractsAsTypesOnly || isAstFunctionUsesContractParseGuard({ funcNode: node });

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
