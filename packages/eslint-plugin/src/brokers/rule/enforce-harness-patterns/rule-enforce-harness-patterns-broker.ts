/**
 * PURPOSE: Enforces internal patterns for .harness.ts files — the e2e/integration equivalent of enforce-proxy-patterns
 *
 * USAGE:
 * const rule = ruleEnforceHarnessPatternsBroker();
 * // Returns ESLint rule that validates harness files export factory functions returning objects
 */
import { eslintRuleContract } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintRule } from '../../../contracts/eslint-rule/eslint-rule-contract';
import { AST_NODE_TYPES } from '#gateway/npm/typescript-eslint__utils';
import type { TSESLint, TSESTree } from '#gateway/npm/typescript-eslint__utils';
import { isHarnessFileGuard } from '../../../guards/is-harness-file/is-harness-file-guard';
import { isProxyImportGuard } from '../../../guards/is-proxy-import/is-proxy-import-guard';
import { validateHarnessConstructorSideEffectsLayerBroker } from './validate-harness-constructor-side-effects-layer-broker';

export const ruleEnforceHarnessPatternsBroker = (): EslintRule => ({
  ...eslintRuleContract.parse({
    meta: {
      type: 'problem',
      docs: {
        description:
          'Enforce harness file patterns for .harness.ts files: factory function returning object, no proxy imports, no contract value imports.',
      },
      messages: {
        harnessMustReturnObject:
          'Harness function must return an object, not void, primitive, or array. Expected: export const fooHarness = () => ({ method: () => {} })',
        harnessNoProxyImports:
          'Harness files must not import proxy files ({{importPath}}). Harnesses and proxies use different mock mechanisms.',
        harnessNoContractImports:
          'Harness files must not import from contract files ({{importPath}}). Import from stub files (.stub.ts) instead.',
        harnessConstructorNoSideEffects:
          'Harness constructor must only register lifecycle hooks, create child harnesses, and use node builtins (fs/path/os). Found side effect: {{type}}',
      },
      schema: [],
    },
  }),
  create: (context: TSESLint.RuleContext<string, unknown[]>) => {
    const ctx = context;
    const { filename } = ctx;

    if (!isHarnessFileGuard({ filename })) {
      return {};
    }

    return {
      // Check for proxy imports and contract imports
      ImportDeclaration: (node: TSESTree.ImportDeclaration): void => {
        const { source, importKind } = node;
        if (typeof source.value !== 'string') return;

        const importPath = source.value;

        // Ban proxy imports
        if (isProxyImportGuard({ importSource: importPath })) {
          ctx.report({
            node,
            messageId: 'harnessNoProxyImports',
            data: { importPath },
          });
        }

        // Ban contract value imports (allow type-only)
        if (importKind === 'type') {
          return;
        }

        if (importPath.endsWith('-contract')) {
          ctx.report({
            node,
            messageId: 'harnessNoContractImports',
            data: { importPath },
          });
        }
      },

      // Validate exported harness function returns object
      ExportNamedDeclaration: (node: TSESTree.ExportNamedDeclaration): void => {
        const { declaration } = node;

        if (!declaration) return;
        if (declaration.type !== AST_NODE_TYPES.VariableDeclaration) return;

        const { declarations } = declaration;
        if (declarations.length === 0) return;

        const [firstDeclaration] = declarations;
        const { id } = firstDeclaration;
        const { init } = firstDeclaration;

        if (!init) return;

        const name = id.type === AST_NODE_TYPES.Identifier ? id.name : undefined;
        if (!name?.endsWith('Harness')) return;

        if (
          init.type !== AST_NODE_TYPES.ArrowFunctionExpression &&
          init.type !== AST_NODE_TYPES.FunctionExpression
        ) {
          return;
        }

        // Check that the function body has a return statement returning an object
        const { body } = init;
        if (body.type !== AST_NODE_TYPES.BlockStatement) {
          // Expression body: () => ({...}) — this is an object, which is fine
          if (body.type === AST_NODE_TYPES.ObjectExpression) {
            return;
          }
          // Other expression bodies are flagged
          ctx.report({ node: init, messageId: 'harnessMustReturnObject' });
          return;
        }

        // Block body: check return statements
        const hasReturnWithObject = body.body.some(
          (stmt: TSESTree.Node) =>
            stmt.type === AST_NODE_TYPES.ReturnStatement &&
            stmt.argument?.type === AST_NODE_TYPES.ObjectExpression,
        );

        if (!hasReturnWithObject) {
          ctx.report({
            node: init,
            messageId: 'harnessMustReturnObject',
          });
          return;
        }

        validateHarnessConstructorSideEffectsLayerBroker({ functionNode: init, context: ctx });
      },
    };
  },
});
