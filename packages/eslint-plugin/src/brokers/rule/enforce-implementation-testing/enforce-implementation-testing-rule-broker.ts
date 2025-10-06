import type { Rule } from '../../../adapters/eslint/eslint-rule-adapter';
import { fsExistsSyncAdapter } from '../../../adapters/fs/fs-exists-sync-adapter';
import { filePathContract } from '../../../contracts/file-path/file-path-contract';
import { testFilePathVariantsTransformer } from '../../../transformers/test-file-path-variants/test-file-path-variants-transformer';

export const enforceImplementationTestingRuleBroker = (): Rule.RuleModule => ({
  meta: {
    type: 'problem',
    docs: {
      description:
        'Enforce implementation files have colocated test files, and contract files have both test and stub files',
    },
    messages: {
      missingTestFile:
        'Implementation file must have a colocated test file. Create {{testFileName}} (or .integration.test.ts or .spec.ts variant) in the same directory.',
      missingStubFile:
        'Contract file must have a colocated stub file. Create {{stubFileName}} in the same directory.',
      missingContractTestFile:
        'Contract file must have a colocated test file. Create {{testFileName}} (or .integration.test.ts or .spec.ts variant) in the same directory.',
    },
    schema: [],
  },
  create: (context: Rule.RuleContext) => ({
    Program: (node): void => {
      const { filename } = context;

      // Skip files with multiple dots (e.g., .test.ts, .stub.ts, .d.ts, etc.)
      const fileBaseName = filename.split('/').pop() ?? '';
      const dotCount = (fileBaseName.match(/\./gu) ?? []).length;
      if (dotCount > 1) {
        return;
      }

      // Only check files in /src/ directory
      if (!filename.includes('/src/')) {
        return;
      }

      // Determine if this is a contract file
      const isContract = filename.includes('/contracts/') && filename.endsWith('-contract.ts');

      // Get all possible test file paths for this source file
      const testFilePaths = testFilePathVariantsTransformer({ sourceFilePath: filename });

      // Check if any test file exists
      const hasTestFile = testFilePaths.some((testFilePath) => {
        const parsedPath = filePathContract.parse(testFilePath);
        return fsExistsSyncAdapter({ filePath: parsedPath });
      });

      if (!hasTestFile) {
        const messageId = isContract ? 'missingContractTestFile' : 'missingTestFile';
        const primaryTestFileName = testFilePaths[0] ?? filename;
        context.report({
          node,
          messageId,
          data: {
            testFileName: primaryTestFileName.split('/').pop() ?? primaryTestFileName,
          },
        });
        return;
      }

      // For contract files, also check for stub file
      if (isContract) {
        const stubFileName = filename.replace(/-contract\.ts$/u, '.stub.ts');
        const stubFilePath = filePathContract.parse(stubFileName);
        const hasStubFile = fsExistsSyncAdapter({ filePath: stubFilePath });

        if (!hasStubFile) {
          context.report({
            node,
            messageId: 'missingStubFile',
            data: {
              stubFileName: stubFileName.split('/').pop() ?? stubFileName,
            },
          });
        }
      }
    },
  }),
});
