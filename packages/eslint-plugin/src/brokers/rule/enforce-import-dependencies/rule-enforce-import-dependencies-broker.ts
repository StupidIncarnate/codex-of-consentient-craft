/**
 * PURPOSE: Enforces folder-level import restrictions based on architectural boundaries
 *
 * USAGE:
 * const rule = ruleEnforceImportDependenciesBroker();
 * // Returns ESLint rule that prevents brokers from importing from responders, enforces entry files, etc.
 */
import { eslintRuleContract } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintRule } from '../../../contracts/eslint-rule/eslint-rule-contract';
import type { EslintContext } from '../../../contracts/eslint-context/eslint-context-contract';
import type { Tsestree } from '../../../contracts/tsestree/tsestree-contract';
import { isEntryFileGuard } from '../../../guards/is-entry-file/is-entry-file-guard';
import { isSameDomainFolderGuard } from '../../../guards/is-same-domain-folder/is-same-domain-folder-guard';
import { hasFileSuffixGuard } from '../../../guards/has-file-suffix/has-file-suffix-guard';
import { isTestFileGuard } from '../../../guards/is-test-file/is-test-file-guard';
import { isStubFileGuard } from '../../../guards/is-stub-file/is-stub-file-guard';
import { fileBasenameTransformer } from '../../../transformers/file-basename/file-basename-transformer';
import { folderConfigTransformer } from '../../../transformers/folder-config/folder-config-transformer';
import { folderTypeTransformer } from '../../../transformers/folder-type/folder-type-transformer';
import { filepathResolveRelativeImportTransformer } from '../../../transformers/filepath-resolve-relative-import/filepath-resolve-relative-import-transformer';
import { dotCountTransformer } from '../../../transformers/dot-count/dot-count-transformer';
import { validateExternalImportLayerBroker } from './validate-external-import-layer-broker';

export const ruleEnforceImportDependenciesBroker = (): EslintRule => ({
  ...eslintRuleContract.parse({
    meta: {
      type: 'problem',
      docs: {
        description: 'Enforce folder-level import restrictions based on architecture',
      },
      messages: {
        forbiddenImport:
          '{{folderType}}/ cannot import from {{importedFolder}}/. Allowed imports: {{allowed}}',
        forbiddenExternalImport:
          '{{folderType}}/ cannot import external package "{{packageName}}". Only internal imports allowed.',
        nonEntryFileImport:
          'Cannot import non-entry file "{{importedFile}}" from {{folderType}}/. Only entry files matching pattern {{pattern}} can be imported across folders.',
        unnecessaryCategoryInPath:
          'Unnecessary category name in import path. When importing within {{folderType}}/, use "{{suggestedPath}}" instead of "{{importPath}}".',
      },
      schema: [],
    },
  }),
  create: (context: EslintContext) => {
    const ctx = context;
    return {
      ImportDeclaration: (node: Tsestree): void => {
        // Skip validation for .proxy.ts files - they have their own proxy rules
        if (
          hasFileSuffixGuard({
            ...(ctx.filename ? { filename: String(ctx.filename) } : {}),
            suffix: 'proxy',
          })
        ) {
          return;
        }

        const folderType = folderTypeTransformer({ filename: ctx.filename ?? '' });

        if (folderType === null) {
          return;
        }

        const allowedImports = folderConfigTransformer({ folderType })?.allowedImports ?? [];

        const importSource = node.source?.value;

        if (typeof importSource !== 'string') {
          return;
        }

        const isRelativeImport = importSource.startsWith('.');

        if (isRelativeImport) {
          // Check if import is from the same domain folder
          const isSameFolder = isSameDomainFolderGuard({
            currentFilePath: ctx.filename ?? '',
            importPath: importSource,
          });

          // Same-folder imports are always allowed
          if (isSameFolder) {
            return;
          }

          // For cross-folder imports, determine the imported folder type by resolving the path
          const resolvedImportPath = filepathResolveRelativeImportTransformer({
            currentFilePath: ctx.filename ?? '',
            importPath: importSource,
          });

          const importedFolderType = folderTypeTransformer({ filename: resolvedImportPath });

          if (importedFolderType === null) {
            return;
          }

          const importedFolder = importedFolderType;

          // Check if importing from same category with unnecessary category name in path
          // E.g., brokers importing from ../../../brokers/ instead of ../../
          if (importedFolder === folderType) {
            // Check if the import path explicitly contains the category name
            const pathSegments = importSource.split('/');
            const categoryInPath = pathSegments.find((segment) => segment === folderType);

            if (categoryInPath !== undefined) {
              // Calculate the suggested path by removing the category segment
              const levelsUp = pathSegments.filter((seg) => seg === '..').length;
              const pathAfterCategory = pathSegments.slice(pathSegments.indexOf(folderType) + 1);
              const suggestedLevels = levelsUp - 1; // One less level since we're not exiting the category
              const suggestedPath = `${'../'.repeat(suggestedLevels)}${pathAfterCategory.join('/')}`;

              ctx.report({
                node,
                messageId: 'unnecessaryCategoryInPath',
                data: {
                  folderType,
                  importPath: importSource,
                  suggestedPath,
                },
              });
              return;
            }
          }

          // Check if the folder is allowed
          const isAllowed = allowedImports.some((allowed: string) => {
            if (allowed === 'node_modules') {
              return false;
            }

            const folderName = allowed.endsWith('/') ? allowed.slice(0, -1) : allowed;
            return importedFolder === folderName;
          });

          if (!isAllowed) {
            ctx.report({
              node,
              messageId: 'forbiddenImport',
              data: {
                folderType,
                importedFolder,
                allowed: allowedImports.join(', '),
              },
            });
            return;
          }

          // Folder is allowed, but check if importing an entry file
          const isEntryFile = isEntryFileGuard({
            filePath: resolvedImportPath,
            folderType: importedFolderType,
          });

          if (!isEntryFile) {
            // Exception: Test files and stub files can import .stub.ts files from contracts folder
            const isTestFile = isTestFileGuard({ filename: ctx.filename ?? '' });
            const isCurrentFileStub = isStubFileGuard({ filename: ctx.filename ?? '' });
            const isImportedFileStub = isStubFileGuard({ filename: importSource });
            const isFromContracts = importedFolderType === 'contracts';

            if ((isTestFile || isCurrentFileStub) && isImportedFileStub && isFromContracts) {
              // Allow test files and stub files to import stubs from contracts
              return;
            }

            const importedFolderConfig = folderConfigTransformer({
              folderType: importedFolderType,
            });

            if (!importedFolderConfig) {
              return;
            }

            // Filter out multi-dot patterns (.stub.ts, .mock.ts, .test.ts) from display
            // These can't be imported cross-folder even though they're in fileSuffix
            const suffixes = Array.isArray(importedFolderConfig.fileSuffix)
              ? importedFolderConfig.fileSuffix
              : [importedFolderConfig.fileSuffix];

            const importableSuffixes = suffixes.filter((suffix: string) => {
              const dotCount = dotCountTransformer({ str: suffix });
              return dotCount <= 1;
            });

            const patternDisplay = importableSuffixes.join(' or ');
            const displayFilename = fileBasenameTransformer({ filename: importSource });

            ctx.report({
              node,
              messageId: 'nonEntryFileImport',
              data: {
                folderType,
                importedFile: displayFilename,
                importedFolder,
                pattern: patternDisplay,
              },
            });
          }
          return;
        }

        // Non-relative import (external package or cross-package folder-typed import): gated by the
        // SAME folder rules as local cross-folder imports — folder type, not package name, decides.
        validateExternalImportLayerBroker({
          node,
          context: ctx,
          folderType,
          allowedImports,
          importSource,
        });
      },
    };
  },
});
