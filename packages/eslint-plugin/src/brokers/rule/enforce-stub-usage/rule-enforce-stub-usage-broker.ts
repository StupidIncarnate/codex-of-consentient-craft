/**
 * PURPOSE: Creates ESLint rule that enforces using stub functions instead of inline object/array literals in test files, and instead of object literals cast to an outside package's type in test, proxy, stub and harness files
 *
 * USAGE:
 * const rule = ruleEnforceStubUsageBroker();
 * // Returns RuleModule that reports inline typed literals in test files, and `{ ... } as TSESTree.CallExpression` casts
 * // (also `as unknown as`, `Partial<...>`) to a type imported from a package, gateway files included.
 * // Option `outsideTypeCasts: false` turns the cast check off.
 *
 * WHEN-TO-USE: When registering ESLint rules to ensure test files use reusable stub functions for consistency
 */
import { AST_NODE_TYPES } from '#gateway/npm/typescript-eslint__utils';
import type { TSESLint, TSESTree } from '#gateway/npm/typescript-eslint__utils';
import type { ModulePath } from '@dungeonmaster/shared/contracts';
import { hasFileSuffixGuard } from '../../../guards/has-file-suffix/has-file-suffix-guard';
import { isAstObjectStubSpreadGuard } from '../../../guards/is-ast-object-stub-spread/is-ast-object-stub-spread-guard';
import { isGatewayFileGuard } from '../../../guards/is-gateway-file/is-gateway-file-guard';
import { isTestSupportFileGuard } from '../../../guards/is-test-support-file/is-test-support-file-guard';
import { astGetImportsTransformer } from '../../../transformers/ast-get-imports/ast-get-imports-transformer';
import { typeNameFromAnnotationTransformer } from '../../../transformers/type-name-from-annotation/type-name-from-annotation-transformer';
import { outsideTypeCastReportLayerBroker } from './outside-type-cast-report-layer-broker';

export const ruleEnforceStubUsageBroker = (): TSESLint.RuleModule<
  'useStubInsteadOfTypedLiteral' | 'outsideTypeCast',
  [{ outsideTypeCasts?: boolean }]
> => ({
  meta: {
    type: 'problem',
    docs: {
      description:
        'Enforce using stub functions instead of inline object/array literals in test files, and instead of object literals cast to an outside package type in test, proxy, stub and harness files',
    },
    messages: {
      useStubInsteadOfTypedLiteral:
        'Use stub function instead of inline object/array literal. Create or use existing stub for type "{{typeName}}".',
      outsideTypeCast:
        "An outside type is built by hand and cast: {{typeName}}. Use the gateway's stub for it, imported from its own file.",
    },
    schema: [
      {
        type: 'object',
        properties: {
          outsideTypeCasts: {
            type: 'boolean',
            description: 'Report an object literal cast to a type imported from a package',
          },
        },
        additionalProperties: false,
      },
    ],
  },
  defaultOptions: [{ outsideTypeCasts: true }],
  create: (context: TSESLint.RuleContext<string, unknown[]>) => {
    const ctx = context;
    const { filename } = ctx;

    // ESLint applies no defaultOptions to a plain RuleModule: the check is on unless switched off
    const [firstOption] = ctx.options;
    const outsideTypeCasts =
      typeof firstOption === 'object' && firstOption !== null && 'outsideTypeCasts' in firstOption
        ? firstOption.outsideTypeCasts !== false
        : true;

    // The typed-literal check applies to test files only. It skips the gateway: its tests build
    // plain fixture objects mirroring the outside package's own shape (a Node error, a stat result).
    const checksTypedLiterals =
      hasFileSuffixGuard({ filename, suffix: 'test' }) && !isGatewayFileGuard({ filename });

    // The cast check reaches test, proxy, stub and harness files, gateway included: a gateway
    // stub is where the outside value is built from real code, never by hand and cast.
    const checksOutsideCasts = outsideTypeCasts && isTestSupportFileGuard({ filename });

    const imports = new Map<string, ModulePath>();

    const castListeners = checksOutsideCasts
      ? {
          ImportDeclaration: (node: TSESTree.ImportDeclaration): void => {
            for (const [name, source] of astGetImportsTransformer({ node })) {
              imports.set(name, source);
            }
          },
          TSAsExpression: (node: TSESTree.TSAsExpression): void => {
            outsideTypeCastReportLayerBroker({ node, imports, context: ctx });
          },
          TSTypeAssertion: (node: TSESTree.TSTypeAssertion): void => {
            outsideTypeCastReportLayerBroker({ node, imports, context: ctx });
          },
        }
      : {};

    if (!checksTypedLiterals) {
      return castListeners;
    }

    return {
      ...castListeners,
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
