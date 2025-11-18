/**
 * PURPOSE: Enforces that implementation files have colocated test and proxy files, and contract files have stub files
 *
 * USAGE:
 * const rule = ruleEnforceImplementationColocationBroker();
 * // Returns ESLint rule that requires foo-broker.ts to have foo-broker.test.ts and foo-broker.proxy.ts in same directory
 */
import { eslintRuleContract } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintRule } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintContext } from '../../../contracts/eslint-context/eslint-context-contract';
import type { Tsestree } from '../../../contracts/tsestree/tsestree-contract';
import { fsExistsSyncAdapter } from '../../../adapters/fs/exists-sync/fs-exists-sync-adapter';
import { filePathContract } from '@questmaestro/shared/contracts';
import { isFileInFolderTypeGuard } from '../../../guards/is-file-in-folder-type/is-file-in-folder-type-guard';
import { testFilePathVariantsTransformer } from '../../../transformers/test-file-path-variants/test-file-path-variants-transformer';
import { folderConfigStatics } from '@questmaestro/shared/statics';
import { projectFolderTypeFromFilePathTransformer } from '../../../transformers/project-folder-type-from-file-path/project-folder-type-from-file-path-transformer';
import { dotCountTransformer } from '../../../transformers/dot-count/dot-count-transformer';
import { removeFileExtensionTransformer } from '../../../transformers/remove-file-extension/remove-file-extension-transformer';
import { hasFolderTypeSuffixGuard } from '../../../guards/has-folder-type-suffix/has-folder-type-suffix-guard';
import { extractFirstSegmentTransformer } from '../../../transformers/extract-first-segment/extract-first-segment-transformer';
import { contractPathToStubPathTransformer } from '../../../transformers/contract-path-to-stub-path/contract-path-to-stub-path-transformer';
import { getFileExtensionTransformer } from '../../../transformers/get-file-extension/get-file-extension-transformer';

export const ruleEnforceImplementationColocationBroker = (): EslintRule => ({
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
        missingTestFileWithLayer:
          'Implementation file must have a colocated test file. Create {{testFileName}} (or .integration.test.ts or .spec.ts variant) in the same directory. Layer files (helpers decomposing complex parents) also need test files.',
        missingProxyFile:
          'Testable file must have a colocated proxy file. Create {{proxyFileName}} in the same directory.',
        missingProxyFileWithLayer:
          'Testable file must have a colocated proxy file. Create {{proxyFileName}} in the same directory. Layer files (helpers for complex parents) need their own proxy files if they have dependencies to mock.',
        missingStubFile:
          'Contract file must have a colocated stub file. Create {{stubFileName}} in the same directory.',
        invalidProxyFilename:
          'Proxy file must follow naming pattern [baseName]-[folderType].proxy.ts. Expected: {{expectedFileName}}, but found: {{actualFileName}}',
      },
      schema: [],
    },
  }),
  create: (context: EslintContext) => {
    const ctx = context;
    return {
      Program: (node: Tsestree): void => {
        const { filename } = ctx;

        // Skip if filename is not provided
        if (!filename) {
          return;
        }

        // Skip files with multiple dots (e.g., .test.ts, .stub.ts, .d.ts, etc.)
        const fileBaseName = filename.split('/').pop() ?? '';
        const dotCount = dotCountTransformer({ str: fileBaseName });
        if (dotCount > 1) {
          return;
        }

        // Only check files in /src/ directory
        if (!filename.includes('/src/')) {
          return;
        }

        // Get folder type and config
        const folderType = projectFolderTypeFromFilePathTransformer({ filename });
        const folderConfigValue: unknown = folderType
          ? Reflect.get(folderConfigStatics, folderType)
          : undefined;
        const folderConfig =
          folderConfigValue !== null &&
          folderConfigValue !== undefined &&
          typeof folderConfigValue === 'object'
            ? folderConfigValue
            : undefined;

        // Determine if this is a contract file
        const isContract = isFileInFolderTypeGuard({
          filename,
          folderType: 'contracts',
          suffix: 'contract',
        });

        // Determine if this is a statics file (doesn't need tests - just data)
        const isStatics = isFileInFolderTypeGuard({
          filename,
          folderType: 'statics',
          suffix: 'statics',
        });

        // Get all possible test file paths for this source file
        const testFilePaths = testFilePathVariantsTransformer({ sourceFilePath: filename });

        // Check if any test file exists
        const hasTestFile = testFilePaths.some((testFilePath) => {
          const parsedPath = filePathContract.parse(testFilePath);
          return fsExistsSyncAdapter({ filePath: parsedPath });
        });

        // Check for test file (skip statics)
        if (!isStatics && !hasTestFile) {
          const primaryTestFileName = testFilePaths[0] ?? filename;
          const allowsLayerFiles =
            folderConfig && 'allowsLayerFiles' in folderConfig
              ? Boolean(Reflect.get(folderConfig, 'allowsLayerFiles'))
              : false;
          ctx.report({
            node,
            messageId: allowsLayerFiles ? 'missingTestFileWithLayer' : 'missingTestFile',
            data: {
              testFileName: primaryTestFileName.split('/').pop() ?? primaryTestFileName,
            },
          });
        }

        // For contract files, also check for stub file
        if (isContract) {
          const filenameParts = filename.split('/');
          const contractFileName = filenameParts.pop() ?? '';
          const directory = filenameParts.join('/');
          // contractPathToStubPathTransformer converts: user-contract.ts -> user.stub
          // We need to add .ts extension back
          const stubBaseNameWithoutExtension = contractPathToStubPathTransformer({
            contractPath: contractFileName,
          });
          const stubBaseName = `${stubBaseNameWithoutExtension}.ts`;
          const stubFileName = directory ? `${directory}/${stubBaseName}` : stubBaseName;
          const stubFilePath = filePathContract.parse(stubFileName);
          const hasStubFile = fsExistsSyncAdapter({ filePath: stubFilePath });

          if (!hasStubFile) {
            ctx.report({
              node,
              messageId: 'missingStubFile',
              data: {
                stubFileName: stubBaseName,
              },
            });
          }
        }

        // Check for proxy file based on folder config (per testing-standards.md:403-418)
        // Note: folderType and folderConfig already declared above

        // Default to not requiring proxy if config doesn't exist or doesn't specify
        const requireProxyValue: unknown =
          folderConfig && 'requireProxy' in folderConfig
            ? Reflect.get(folderConfig, 'requireProxy')
            : undefined;
        const needsProxyFile = requireProxyValue === true;

        if (needsProxyFile) {
          // Derive expected proxy file name
          const extension = getFileExtensionTransformer({ filename });
          const withoutExtension = removeFileExtensionTransformer({ filename: fileBaseName });
          const proxyBaseName = `${withoutExtension}.proxy${extension}`;
          const filenameParts = filename.split('/');
          filenameParts.pop();
          const directory = filenameParts.join('/');
          const proxyFileName = directory ? `${directory}/${proxyBaseName}` : proxyBaseName;
          const proxyFilePath = filePathContract.parse(proxyFileName);
          const hasProxyFile = fsExistsSyncAdapter({ filePath: proxyFilePath });

          if (!hasProxyFile) {
            // Check if an incorrectly named proxy file might exist
            // Extract base filename and folder type for validation
            const baseFileName = removeFileExtensionTransformer({ filename: fileBaseName });
            const folderTypeMatch = hasFolderTypeSuffixGuard({ name: baseFileName });

            if (folderTypeMatch) {
              // Check for common invalid patterns
              // Extract just the first part before any folder type pattern starts
              // E.g., "http-adapter" → "http", "user-fetch-broker" → "user", "format-date-transformer" → "format"
              // Match everything before the pattern that includes the folder type
              // This handles cases like: user-fetch-broker → user, format-date-transformer → format
              const firstPart = extractFirstSegmentTransformer({ str: baseFileName });

              const ext = getFileExtensionTransformer({ filename, includesDot: false });
              const invalidProxyFileName = `${firstPart}.proxy.${ext}`;
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
                    expectedFileName: `${baseFileName}.proxy.${ext}`,
                    actualFileName: invalidProxyFileName,
                  },
                });
                return;
              }
            }

            const allowsLayerFilesForProxy =
              folderConfig && 'allowsLayerFiles' in folderConfig
                ? Boolean(Reflect.get(folderConfig, 'allowsLayerFiles'))
                : false;
            ctx.report({
              node,
              messageId: allowsLayerFilesForProxy
                ? 'missingProxyFileWithLayer'
                : 'missingProxyFile',
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
