/**
 * PURPOSE: Bans top-level helper function declarations in test scenario files to enforce using harness files
 *
 * USAGE:
 * const rule = ruleBanInlineHelpersInTestScenariosBroker();
 * // Returns ESLint rule that prevents inline helper functions in *.e2e.ts and *.integration.test.ts files
 */
import { AST_NODE_TYPES } from '#gateway/npm/typescript-eslint__utils';
import type { TSESLint, TSESTree } from '#gateway/npm/typescript-eslint__utils';
import { isSpecFileGuard } from '../../../guards/is-spec-file/is-spec-file-guard';
import { isIntegrationTestFileGuard } from '../../../guards/is-integration-test-file/is-integration-test-file-guard';

export const ruleBanInlineHelpersInTestScenariosBroker =
  (): TSESLint.RuleModule<'noInlineHelper'> => ({
    meta: {
      type: 'problem',
      docs: {
        description:
          'Ban top-level helper function declarations in test scenario files. Move helpers to .harness.ts files in test/harnesses/.',
      },
      messages: {
        noInlineHelper:
          'Test scenario files must not define helper functions at module level. Move "{{name}}" to a .harness.ts file in test/harnesses/.',
      },
      schema: [],
    },
    defaultOptions: [],
    create: (context: TSESLint.RuleContext<string, unknown[]>) => {
      const ctx = context;
      const { filename } = ctx;

      const isSpec = isSpecFileGuard({ filename });
      const isIntegration = isIntegrationTestFileGuard({
        filePath: filename,
      });

      if (!isSpec && !isIntegration) {
        return {};
      }

      return {
        // Detect top-level: export const foo = (...) => { ... }
        // and top-level: const foo = (...) => { ... }
        VariableDeclarator: (node: TSESTree.VariableDeclarator): void => {
          // Only check module-level declarations (parent chain: VariableDeclaration -> Program or ExportNamedDeclaration -> Program)
          const ancestors = ctx.sourceCode.getAncestors(node);

          // The parent chain for a top-level const is:
          // Program > (ExportNamedDeclaration >)? VariableDeclaration > VariableDeclarator
          // We need depth 2 or 3 from Program
          const isTopLevel = ancestors.some((ancestor) => ancestor.type === AST_NODE_TYPES.Program);

          // Must be directly under Program (not inside a function, describe block, etc.)
          // Check that no ancestor is a function or call expression callback
          const isInsideFunction = ancestors.some(
            (ancestor) =>
              ancestor.type === AST_NODE_TYPES.ArrowFunctionExpression ||
              ancestor.type === AST_NODE_TYPES.FunctionExpression ||
              ancestor.type === AST_NODE_TYPES.FunctionDeclaration,
          );

          if (!isTopLevel || isInsideFunction) {
            return;
          }

          const { id, init } = node;

          // Only flag arrow functions with block bodies (not simple expressions/constants)
          if (init?.type !== AST_NODE_TYPES.ArrowFunctionExpression) {
            return;
          }

          // Only flag block body functions: () => { ... }
          // Allow expression body: () => value (these are typically simple constants/transforms)
          const { body } = init;
          if (body.type !== AST_NODE_TYPES.BlockStatement) {
            return;
          }

          const name = (id.type === AST_NODE_TYPES.Identifier ? id.name : undefined) ?? 'anonymous';

          ctx.report({
            node,
            messageId: 'noInlineHelper',
            data: { name },
          });
        },
      };
    },
  });
