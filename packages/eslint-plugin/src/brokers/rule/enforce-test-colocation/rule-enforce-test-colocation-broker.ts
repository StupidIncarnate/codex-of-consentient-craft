/**
 * PURPOSE: Creates ESLint rule that enforces test files are co-located with their implementation files in the same directory
 *
 * USAGE:
 * const rule = ruleEnforceTestColocationBroker();
 * // Returns RuleModule that validates test files have matching implementation files in same directory
 *
 * WHEN-TO-USE: When registering ESLint rules to ensure test files follow co-location pattern
 */
import type { TSESLint, TSESTree } from '#gateway/npm/typescript-eslint__utils';
import { existsSync } from '#gateway/node/fs';
import { filePathContract } from '@dungeonmaster/shared/contracts';
import { isTestFileGuard } from '../../../guards/is-test-file/is-test-file-guard';
import { isE2eTestFileGuard } from '../../../guards/is-e2e-test-file/is-e2e-test-file-guard';
import { testFilePathToImplementationPathTransformer } from '../../../transformers/test-file-path-to-implementation-path/test-file-path-to-implementation-path-transformer';
import { filePathWithTypeInfixTransformer } from '../../../transformers/file-path-with-type-infix/file-path-with-type-infix-transformer';

export const ruleEnforceTestColocationBroker = (): TSESLint.RuleModule<'testNotColocated'> => ({
  meta: {
    type: 'problem',
    docs: {
      description: 'Enforce test files are co-located with source files',
    },
    messages: {
      testNotColocated:
        'Test file must be co-located with its implementation file. Expected implementation file "{{expectedPath}}" not found in the same directory.',
    },
    schema: [],
  },
  defaultOptions: [],
  create: (context: TSESLint.RuleContext<string, unknown[]>) => {
    const ctx = context;
    return {
      Program: (node: TSESTree.Program): void => {
        const { filename } = ctx;

        // Only check test files
        if (!filename || !isTestFileGuard({ filename })) {
          return;
        }

        const testFilePath = filePathContract.parse(filename);

        // E2e files (.e2e.ts) colocate with the entry flow they exercise — they have no
        // single implementation companion, so exempt them from the test↔impl pairing check.
        if (isE2eTestFileGuard({ filePath: testFilePath })) {
          return;
        }

        // Non-e2e tests must have colocated implementation file
        const basePath = testFilePathToImplementationPathTransformer({ testFilePath });

        // Check for standard implementation file (e.g., user-broker.ts)
        const hasStandardImpl = existsSync(basePath);

        // Check for .type implementation file (e.g., stub-argument.type.ts)
        const typeImplPath = filePathWithTypeInfixTransformer({ filePath: basePath });
        const hasTypeImpl = existsSync(typeImplPath);

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
