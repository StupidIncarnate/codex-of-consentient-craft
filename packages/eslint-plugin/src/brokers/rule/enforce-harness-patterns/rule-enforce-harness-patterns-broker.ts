/**
 * PURPOSE: Enforces internal patterns for .harness.ts files — the e2e/integration equivalent of enforce-proxy-patterns
 *
 * USAGE:
 * const rule = ruleEnforceHarnessPatternsBroker();
 * // Returns ESLint rule that validates harness files export factory functions returning objects
 */
import { eslintRuleContract } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintRule } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintContext } from '../../../contracts/eslint-context/eslint-context-contract';
import type { Tsestree } from '../../../contracts/tsestree/tsestree-contract';
import { isHarnessFileGuard } from '../../../guards/is-harness-file/is-harness-file-guard';
import { isProxyImportGuard } from '../../../guards/is-proxy-import/is-proxy-import-guard';

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
      },
      schema: [],
    },
  }),
  create: (context: EslintContext) => {
    const ctx = context;
    const filename = ctx.filename ?? '';

    if (!isHarnessFileGuard({ filename })) {
      return {};
    }

    return {
      // Check for proxy imports and contract imports
      ImportDeclaration: (node: Tsestree): void => {
        const { source, importKind } = node;
        if (!source || typeof source.value !== 'string') return;

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
      ExportNamedDeclaration: (node: Tsestree): void => {
        const { declaration } = node;

        if (!declaration) return;
        if (declaration.type !== 'VariableDeclaration') return;

        const { declarations } = declaration;
        if (!declarations || declarations.length === 0) return;

        const [firstDeclaration] = declarations;
        const id = firstDeclaration?.id;
        const init = firstDeclaration?.init;

        if (!id || !init) return;

        const { name } = id;
        if (!name?.endsWith('Harness')) return;

        if (init.type !== 'ArrowFunctionExpression' && init.type !== 'FunctionExpression') {
          return;
        }

        // Check that the function body has a return statement returning an object
        const { body } = init;
        if (body === null || body === undefined || Array.isArray(body)) {
          ctx.report({ node: init, messageId: 'harnessMustReturnObject' });
          return;
        }

        if (body.type !== 'BlockStatement') {
          // Expression body: () => ({...}) — this is an object, which is fine
          if (body.type === 'ObjectExpression') {
            return;
          }
          // Other expression bodies are flagged
          ctx.report({ node: init, messageId: 'harnessMustReturnObject' });
          return;
        }

        // Block body: check return statements
        const bodyStatements = body.body;
        if (
          bodyStatements === null ||
          bodyStatements === undefined ||
          !Array.isArray(bodyStatements)
        ) {
          ctx.report({ node: init, messageId: 'harnessMustReturnObject' });
          return;
        }
        const hasReturnWithObject = bodyStatements.some(
          (stmt: Tsestree) =>
            stmt.type === 'ReturnStatement' && stmt.argument?.type === 'ObjectExpression',
        );

        if (!hasReturnWithObject) {
          ctx.report({
            node: init,
            messageId: 'harnessMustReturnObject',
          });
        }
      },
    };
  },
});
