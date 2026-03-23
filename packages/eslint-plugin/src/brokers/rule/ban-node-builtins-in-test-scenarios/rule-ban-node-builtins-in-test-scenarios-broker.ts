/**
 * PURPOSE: Bans direct imports of Node.js builtins in test scenario files (spec and integration tests)
 *
 * USAGE:
 * const rule = ruleBanNodeBuiltinsInTestScenariosBroker();
 * // Returns ESLint rule that prevents importing fs, path, os, crypto in spec/integration test files
 */
import { eslintRuleContract } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintRule } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintContext } from '../../../contracts/eslint-context/eslint-context-contract';
import type { Tsestree } from '../../../contracts/tsestree/tsestree-contract';
import { isSpecFileGuard } from '../../../guards/is-spec-file/is-spec-file-guard';
import { isIntegrationTestFileGuard } from '../../../guards/is-integration-test-file/is-integration-test-file-guard';
import { isInTestDirGuard } from '../../../guards/is-in-test-dir/is-in-test-dir-guard';
import { harnessPatternsStatics } from '../../../statics/harness-patterns/harness-patterns-statics';
import type { FilePath } from '@dungeonmaster/shared/contracts';

export const ruleBanNodeBuiltinsInTestScenariosBroker = (): EslintRule => ({
  ...eslintRuleContract.parse({
    meta: {
      type: 'problem',
      docs: {
        description:
          'Ban Node.js builtin imports in test scenario files. Move filesystem operations to .harness.ts files in test/harnesses/.',
      },
      messages: {
        noNodeBuiltins:
          'Test scenario files must not import Node.js builtins ({{module}}). Move filesystem operations to .harness.ts files in test/harnesses/.',
      },
      schema: [],
    },
  }),
  create: (context: EslintContext) => {
    const ctx = context;
    return {
      ImportDeclaration: (node: Tsestree): void => {
        const filename = ctx.filename ?? '';

        const isInTestDir = isInTestDirGuard({ filename });

        if (isInTestDir) {
          return;
        }

        const isSpecFile = isSpecFileGuard({ filename });
        const isIntegrationTestFile = isIntegrationTestFileGuard({
          filePath: filename as FilePath,
        });

        if (!isSpecFile && !isIntegrationTestFile) {
          return;
        }

        const importSource = node.source?.value;

        if (typeof importSource !== 'string') {
          return;
        }

        const isBannedModule = harnessPatternsStatics.bannedNodeBuiltins.some(
          (mod) => mod === importSource,
        );

        if (!isBannedModule) {
          return;
        }

        ctx.report({
          node,
          messageId: 'noNodeBuiltins',
          data: {
            module: importSource,
          },
        });
      },
    };
  },
});
