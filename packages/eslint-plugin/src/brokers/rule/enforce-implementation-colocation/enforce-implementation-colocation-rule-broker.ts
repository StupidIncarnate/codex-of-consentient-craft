import { eslintRuleContract } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintRule } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintContext } from '../../../contracts/eslint-context/eslint-context-contract';
import type { Tsestree } from '../../../contracts/tsestree/tsestree-contract';
import { fsExistsSyncAdapter } from '../../../adapters/fs/exists-sync/fs-exists-sync-adapter';
import { filePathContract } from '@questmaestro/shared/contracts';
import { testFilePathVariantsTransformer } from '../../../transformers/test-file-path-variants/test-file-path-variants-transformer';

export const enforceImplementationColocationRuleBroker = (): EslintRule => ({
  ...eslintRuleContract.parse({
    meta: {
      type: 'problem',
      docs: {
        description:
          'Enforce implementation files have colocated test and proxy files, and contract files have both test and stub files',
      },
      messages: {
        missingTestFile:
          'Implementation file must have a colocated test file. Create {{testFileName}} (or .integration.test.ts or .spec.ts variant) in the same directory.',
        missingProxyFile:
          'Testable file must have a colocated proxy file. Create {{proxyFileName}} in the same directory.',
        missingStubFile:
          'Contract file must have a colocated stub file. Create {{stubFileName}} in the same directory.',
        missingContractTestFile:
          'Contract file must have a colocated test file. Create {{testFileName}} (or .integration.test.ts or .spec.ts variant) in the same directory.',
        invalidProxyFilename:
          'Proxy file must follow naming pattern [baseName]-[folderType].proxy.ts. Expected: {{expectedFileName}}, but found: {{actualFileName}}',
      },
      schema: [],
    },
  }),
  create: (context: unknown) => {
    const ctx = context as EslintContext;
    return {
      Program: (node: Tsestree): void => {
        const { filename } = ctx;

        // Skip if filename is not provided
        if (!filename) {
          return;
        }

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
          ctx.report({
            node,
            messageId,
            data: {
              testFileName: primaryTestFileName.split('/').pop() ?? primaryTestFileName,
            },
          });
        }

        // For contract files, also check for stub file (only if test file exists)
        if (isContract && hasTestFile) {
          const stubFileName = filename.replace(/-contract\.ts$/u, '.stub.ts');
          const stubFilePath = filePathContract.parse(stubFileName);
          const hasStubFile = fsExistsSyncAdapter({ filePath: stubFilePath });

          if (!hasStubFile) {
            ctx.report({
              node,
              messageId: 'missingStubFile',
              data: {
                stubFileName: stubFileName.split('/').pop() ?? stubFileName,
              },
            });
          }
        }

        // Check for proxy file on files that need proxies (per testing-standards.md:403-418)
        // Files that do NOT need proxies: contracts (use stubs), errors (throw directly), flows/startup (integration tests)
        const excludedFromProxyPatterns = [
          /-contract\.ts$/u,
          /\.stub\.ts$/u,
          /-error\.ts$/u,
          /-flow\.tsx?$/u,
          /-transformer\.ts?$/u,
          /-guard\.ts?$/u,
          /\/startup\//u,
        ];

        const needsProxyFile = !excludedFromProxyPatterns.some((pattern) => pattern.test(filename));

        if (needsProxyFile) {
          // Derive expected proxy file name
          const proxyFileName = filename.replace(/\.tsx?$/u, '.proxy$&');
          const proxyFilePath = filePathContract.parse(proxyFileName);
          const hasProxyFile = fsExistsSyncAdapter({ filePath: proxyFilePath });

          if (!hasProxyFile) {
            // Check if an incorrectly named proxy file might exist
            // Extract base filename and folder type for validation
            const baseFileName = fileBaseName.replace(/\.tsx?$/u, '');
            const folderTypePattern =
              /-(adapter|broker|transformer|guard|binding|middleware|state|responder|widget|statics)$/u;
            const folderTypeMatch = folderTypePattern.exec(baseFileName);

            if (folderTypeMatch) {
              // Check for common invalid patterns
              // Extract just the first part before any folder type pattern starts
              // E.g., "http-adapter" → "http", "user-fetch-broker" → "user", "format-date-transformer" → "format"
              // Match everything before the pattern that includes the folder type
              // This handles cases like: user-fetch-broker → user, format-date-transformer → format
              const firstPartMatch = /^([^-]+)/u.exec(baseFileName);
              const firstPart = firstPartMatch ? firstPartMatch[1] : baseFileName;

              const invalidProxyFileName = `${firstPart}.proxy.${filename.endsWith('.tsx') ? 'tsx' : 'ts'}`;
              const invalidProxyFilePath = filename.replace(fileBaseName, invalidProxyFileName);
              const invalidProxyFilePathContract = filePathContract.parse(invalidProxyFilePath);
              const hasInvalidProxyFile = fsExistsSyncAdapter({
                filePath: invalidProxyFilePathContract,
              });

              if (hasInvalidProxyFile) {
                ctx.report({
                  node,
                  messageId: 'invalidProxyFilename',
                  data: {
                    expectedFileName: `${baseFileName}.proxy.${filename.endsWith('.tsx') ? 'tsx' : 'ts'}`,
                    actualFileName: invalidProxyFileName,
                  },
                });
                return;
              }
            }

            ctx.report({
              node,
              messageId: 'missingProxyFile',
              data: {
                proxyFileName: proxyFileName.split('/').pop() ?? proxyFileName,
              },
            });
          }
        }
      },
    };
  },
});
