/**
 * PURPOSE: Bans top-level helper function declarations in test scenario files to enforce using harness files
 *
 * USAGE:
 * const rule = ruleBanInlineHelpersInTestScenariosBroker();
 * // Returns ESLint rule that prevents inline helper functions in *.spec.ts and *.integration.test.ts files
 */
import { eslintRuleContract } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintRule } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintContext } from '../../../contracts/eslint-context/eslint-context-contract';
import type { Tsestree } from '../../../contracts/tsestree/tsestree-contract';
import { isSpecFileGuard } from '../../../guards/is-spec-file/is-spec-file-guard';
import { isIntegrationTestFileGuard } from '../../../guards/is-integration-test-file/is-integration-test-file-guard';
import { filePathContract } from '@dungeonmaster/shared/contracts';

export const ruleBanInlineHelpersInTestScenariosBroker = (): EslintRule => ({
  ...eslintRuleContract.parse({
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
  }),
  create: (context: EslintContext) => {
    const ctx = context;
    const filename = ctx.filename ?? '';

    const isSpec = isSpecFileGuard({ filename });
    const isIntegration = isIntegrationTestFileGuard({
      filePath: filePathContract.parse(filename),
    });

    if (!isSpec && !isIntegration) {
      return {};
    }

    return {
      // Detect top-level: export const foo = (...) => { ... }
      // and top-level: const foo = (...) => { ... }
      VariableDeclarator: (node: Tsestree): void => {
        // Only check module-level declarations (parent chain: VariableDeclaration -> Program or ExportNamedDeclaration -> Program)
        const ancestors = ctx.sourceCode?.getAncestors(node) ?? [];

        // The parent chain for a top-level const is:
        // Program > (ExportNamedDeclaration >)? VariableDeclaration > VariableDeclarator
        // We need depth 2 or 3 from Program
        const isTopLevel = ancestors.some((ancestor) => ancestor.type === 'Program');

        // Must be directly under Program (not inside a function, describe block, etc.)
        // Check that no ancestor is a function or call expression callback
        const isInsideFunction = ancestors.some(
          (ancestor) =>
            ancestor.type === 'ArrowFunctionExpression' ||
            ancestor.type === 'FunctionExpression' ||
            ancestor.type === 'FunctionDeclaration',
        );

        if (!isTopLevel || isInsideFunction) {
          return;
        }

        const { id, init } = node;

        // Only flag arrow functions with block bodies (not simple expressions/constants)
        if (init === null || init === undefined || init.type !== 'ArrowFunctionExpression') {
          return;
        }

        // Only flag block body functions: () => { ... }
        // Allow expression body: () => value (these are typically simple constants/transforms)
        const { body } = init;
        if (body === null || body === undefined || Array.isArray(body)) {
          return;
        }
        if (body.type !== 'BlockStatement') {
          return;
        }

        const name = id?.name ?? 'anonymous';

        ctx.report({
          node,
          messageId: 'noInlineHelper',
          data: { name },
        });
      },
    };
  },
});
