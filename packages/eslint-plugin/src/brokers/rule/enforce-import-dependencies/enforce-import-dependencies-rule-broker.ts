import type { Rule } from '../../../adapters/eslint/eslint-rule';
import {
  allowedImportContract,
  type AllowedImport,
} from '../../../contracts/allowed-import/allowed-import-contract';
import type { FolderType } from '../../../contracts/folder-type/folder-type-contract';
import { folderConfigTransformer } from '../../../transformers/folder-config/folder-config-transformer';
import { folderTypeTransformer } from '../../../transformers/folder-type/folder-type-transformer';

const extractFolderFromPath = (importPath: string): string | null => {
  const parts = importPath.split('/');

  for (const part of parts) {
    if (part !== '.' && part !== '..' && part !== 'src') {
      return part;
    }
  }

  return null;
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

      const isRelativeImport = importSource.startsWith('.');

      if (isRelativeImport) {
        const importedFolder = extractFolderFromPath(importSource);

        if (importedFolder === null || importedFolder === '') {
          return;
        }

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
