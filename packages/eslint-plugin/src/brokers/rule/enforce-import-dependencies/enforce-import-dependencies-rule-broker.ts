import type { Rule } from '../../../adapters/eslint/eslint-rule-adapter';
import {
  allowedImportContract,
  type AllowedImport,
} from '../../../contracts/allowed-import/allowed-import-contract';
import type { FolderType } from '../../../contracts/folder-type/folder-type-contract';
import { isEntryFileGuard } from '../../../guards/is-entry-file/is-entry-file-guard';
import { isSameDomainFolderGuard } from '../../../guards/is-same-domain-folder/is-same-domain-folder-guard';
import { fileBasenameTransformer } from '../../../transformers/file-basename/file-basename-transformer';
import { folderConfigTransformer } from '../../../transformers/folder-config/folder-config-transformer';
import { folderTypeTransformer } from '../../../transformers/folder-type/folder-type-transformer';

/**
 * Resolves a relative import path to an absolute path.
 * Used to determine the actual folder type of cross-folder imports.
 */
const resolveImportPath = ({
  currentFilePath,
  importPath,
}: {
  currentFilePath: string;
  importPath: string;
}): string => {
  const currentDir = currentFilePath.substring(0, currentFilePath.lastIndexOf('/'));
  const parts = currentDir.split('/').filter((p) => p !== '');

  // Remove any extension from importPath and split by '/'
  const relParts = importPath.replace(/\.(ts|tsx|js|jsx)$/u, '').split('/');

  for (const part of relParts) {
    if (part === '..') {
      parts.pop();
    } else if (part !== '.' && part !== '') {
      parts.push(part);
    }
  }

  return `/${parts.join('/')}.ts`;
};

const getAllowedImportsForFolder = ({
  folderType,
}: {
  folderType: FolderType;
}): readonly AllowedImport[] => {
  const config = folderConfigTransformer({ folderType });
  return config.allowedImports as readonly AllowedImport[];
};

export const enforceImportDependenciesRuleBroker = (): Rule.RuleModule => ({
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
      forbiddenSharedRootImport:
        'Cannot import from "@questmaestro/shared" directly. Use subpath imports like "@questmaestro/shared/contracts" instead.',
    },
    schema: [],
  },
  create: (context: Rule.RuleContext) => ({
    ImportDeclaration: (node): void => {
      const folderType = folderTypeTransformer({ filename: context.filename });

      if (folderType === null) {
        return;
      }

      const allowedImports = getAllowedImportsForFolder({ folderType });

      interface NodeWithSource {
        source?: { value?: unknown };
      }
      const nodeWithSource: NodeWithSource = node;
      const importSource = nodeWithSource.source?.value;

      if (typeof importSource !== 'string') {
        return;
      }

      // Check for @questmaestro/shared imports - treat them like local folder imports
      if (importSource.startsWith('@questmaestro/shared/')) {
        // Extract the folder type from the subpath (e.g., "contracts" from "@questmaestro/shared/contracts")
        const subpath = importSource.replace('@questmaestro/shared/', '');
        const sharedFolderType = subpath.split('/')[0];

        // If no folder type found, skip validation
        if (!sharedFolderType) {
          return;
        }

        // Exception: @questmaestro/shared/@types imports are allowed for all folders (type definitions)
        if (sharedFolderType === '@types') {
          return;
        }

        // Exception: Test files can import .stub.ts files from @questmaestro/shared/contracts
        const isTestFile = /\.(test|spec)\.tsx?$/u.test(context.filename);
        const isStubFile = /\.stub(\.tsx?)?$/u.test(importSource);
        const isFromContracts = sharedFolderType === 'contracts';

        if (isTestFile && isStubFile && isFromContracts) {
          // Allow test files to import stubs from @questmaestro/shared/contracts
          return;
        }

        // Check if this folder type is in the allowed imports
        const isAllowed = allowedImports.some((allowed: string) => {
          if (allowed === '*') {
            return true;
          }

          if (allowed === 'node_modules') {
            return false;
          }

          const folderName = allowed.replace(/\/$/u, '');
          return sharedFolderType === folderName;
        });

        if (!isAllowed) {
          context.report({
            node,
            messageId: 'forbiddenImport',
            data: {
              folderType,
              importedFolder: sharedFolderType,
              allowed: allowedImports.join(', '),
            },
          });
        }
        return;
      }

      // Forbid importing from @questmaestro/shared root
      if (importSource === '@questmaestro/shared') {
        context.report({
          node,
          messageId: 'forbiddenSharedRootImport',
        });
        return;
      }

      const isRelativeImport = importSource.startsWith('.');

      if (isRelativeImport) {
        // Check if import is from the same domain folder
        const isSameFolder = isSameDomainFolderGuard({
          currentFilePath: context.filename,
          importPath: importSource,
        });

        // Same-folder imports are always allowed
        if (isSameFolder) {
          return;
        }

        // For cross-folder imports, determine the imported folder type by resolving the path
        const resolvedImportPath = resolveImportPath({
          currentFilePath: context.filename,
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

            context.report({
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
          if (allowed === '*') {
            return true;
          }

          if (allowed === 'node_modules') {
            return false;
          }

          const folderName = allowed.replace(/\/$/u, '');
          return importedFolder === folderName;
        });

        if (!isAllowed) {
          context.report({
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
          // Exception: Test files can import .stub.ts files from contracts folder
          const isTestFile = /\.(test|spec)\.tsx?$/u.test(context.filename);
          const isStubFile = /\.stub(\.tsx?)?$/u.test(importSource);
          const isFromContracts = importedFolderType === 'contracts';

          if (isTestFile && isStubFile && isFromContracts) {
            // Allow test files to import stubs from contracts
            return;
          }

          const importedFolderConfig = folderConfigTransformer({
            folderType: importedFolderType,
          });

          // Filter out multi-dot patterns (.stub.ts, .mock.ts, .test.ts) from display
          // These can't be imported cross-folder even though they're in fileSuffix
          const suffixes = Array.isArray(importedFolderConfig.fileSuffix)
            ? importedFolderConfig.fileSuffix
            : [importedFolderConfig.fileSuffix];

          const importableSuffixes = suffixes.filter((suffix: string) => {
            const dotCount = (suffix.match(/\./gu) ?? []).length;
            return dotCount <= 1;
          });

          const patternDisplay = importableSuffixes.join(' or ');
          const displayFilename = fileBasenameTransformer({ filename: importSource });

          context.report({
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
      } else {
        // Check if external imports are allowed
        const canImportExternal =
          allowedImports.includes(allowedImportContract.parse('node_modules')) ||
          allowedImports.includes(allowedImportContract.parse('*'));

        // Check if this specific package is explicitly allowed
        const isSpecificPackageAllowed = allowedImports.some((allowed: string) => {
          // Don't treat folder paths as package names
          if (allowed.endsWith('/') || allowed === 'node_modules' || allowed === '*') {
            return false;
          }
          // Check if the import source matches the allowed package name
          return importSource === allowed || importSource.startsWith(`${allowed}/`);
        });

        if (!canImportExternal && !isSpecificPackageAllowed) {
          context.report({
            node,
            messageId: 'forbiddenExternalImport',
            data: {
              folderType,
              packageName: importSource,
            },
          });
        }
      }
    },
  }),
});
