import type { Rule } from '../../../adapters/eslint/eslint-rule-adapter';
import { fsExistsSyncAdapter } from '../../../adapters/fs/exists-sync/fs-exists-sync-adapter';
import { filePathContract } from '@questmaestro/shared/contracts';
import { isE2eTestFileGuard } from '../../../guards/is-e2e-test-file/is-e2e-test-file-guard';
import { isTestFileGuard } from '../../../guards/is-test-file/is-test-file-guard';
import { testFilePathToImplementationPathTransformer } from '../../../transformers/test-file-path-to-implementation-path/test-file-path-to-implementation-path-transformer';

export const enforceTestColocationRuleBroker = (): Rule.RuleModule => ({
  meta: {
    type: 'problem',
    docs: {
      description: 'Enforce test files are co-located with source files',
    },
    messages: {
      testNotColocated:
        'Test file must be co-located with its implementation file. Expected implementation file "{{expectedPath}}" not found in the same directory.',
      e2eTestInSrc:
        'E2E test files should not be in /src/ directory. Move to a dedicated e2e test directory outside /src/.',
    },
    schema: [],
  },
  create: (context: Rule.RuleContext) => ({
    Program: (node): void => {
      const { filename } = context;

      // Only check test files
      if (!isTestFileGuard({ filename })) {
        return;
      }

      const testFilePath = filePathContract.parse(filename);

      // E2E tests should NOT be in /src/
      if (isE2eTestFileGuard({ filePath: testFilePath })) {
        const isInSrcFolder = filename.includes('/src/');
        if (isInSrcFolder) {
          context.report({
            node,
            messageId: 'e2eTestInSrc',
          });
        }
        return;
      }

      // Non-e2e tests must have colocated implementation file
      const implementationPath = testFilePathToImplementationPathTransformer({ testFilePath });

      if (!fsExistsSyncAdapter({ filePath: implementationPath })) {
        context.report({
          node,
          messageId: 'testNotColocated',
          data: {
            expectedPath: implementationPath,
          },
        });
      }
    },
  }),
});
