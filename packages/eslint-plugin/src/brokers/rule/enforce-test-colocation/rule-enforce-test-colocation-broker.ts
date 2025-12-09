/**
 * PURPOSE: Creates ESLint rule that enforces test files are co-located with their implementation files in the same directory
 *
 * USAGE:
 * const rule = ruleEnforceTestColocationBroker();
 * // Returns EslintRule that validates test files have matching implementation files in same directory
 *
 * WHEN-TO-USE: When registering ESLint rules to ensure test files follow co-location pattern
 */
import { eslintRuleContract } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintRule } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintContext } from '../../../contracts/eslint-context/eslint-context-contract';
import type { Tsestree } from '../../../contracts/tsestree/tsestree-contract';
import { fsExistsSyncAdapter } from '../../../adapters/fs/exists-sync/fs-exists-sync-adapter';
import { filePathContract } from '@dungeonmaster/shared/contracts';
import { isTestFileGuard } from '../../../guards/is-test-file/is-test-file-guard';
import { testFilePathToImplementationPathTransformer } from '../../../transformers/test-file-path-to-implementation-path/test-file-path-to-implementation-path-transformer';
import { filePathWithTypeInfixTransformer } from '../../../transformers/file-path-with-type-infix/file-path-with-type-infix-transformer';

export const ruleEnforceTestColocationBroker = (): EslintRule => ({
  ...eslintRuleContract.parse({
    meta: {
      type: 'problem',
      docs: {
        description: 'Enforce test files are co-located with source files',
      },
      messages: {
        testNotColocated:
          'Test file must be co-located with its implementation file. Expected implementation file "{{expectedPath}}" not found in the same directory.',
        // Need to decide what to do with e2e. Having it outside src means we need to change to rootDir in tsconfig which messes things up.
        // e2eTestInSrc:
        //   'E2E test files should not be in /src/ directory. Move to a dedicated e2e test directory outside /src/.',
      },
      schema: [],
    },
  }),
  create: (context: EslintContext) => {
    const ctx = context;
    return {
      Program: (node: Tsestree): void => {
        const { filename } = ctx;

        // Only check test files
        if (!filename || !isTestFileGuard({ filename })) {
          return;
        }

        const testFilePath = filePathContract.parse(filename);

        // // E2E tests should NOT be in /src/
        // if (isE2eTestFileGuard({ filePath: testFilePath })) {
        //   const isInSrcFolder = filename.includes('/src/');
        //   if (isInSrcFolder) {
        //     ctx.report({
        //       node,
        //       messageId: 'e2eTestInSrc',
        //     });
        //   }
        //   return;
        // }

        // Non-e2e tests must have colocated implementation file
        const basePath = testFilePathToImplementationPathTransformer({ testFilePath });

        // Check for standard implementation file (e.g., user-broker.ts)
        const hasStandardImpl = fsExistsSyncAdapter({ filePath: basePath });

        // Check for .type implementation file (e.g., stub-argument.type.ts)
        const typeImplPath = filePathWithTypeInfixTransformer({ filePath: basePath });
        const hasTypeImpl = fsExistsSyncAdapter({ filePath: typeImplPath });

        if (!hasStandardImpl && !hasTypeImpl) {
          ctx.report({
            node,
            messageId: 'testNotColocated',
            data: {
              expectedPath: basePath,
            },
          });
        }
      },
    };
  },
});
