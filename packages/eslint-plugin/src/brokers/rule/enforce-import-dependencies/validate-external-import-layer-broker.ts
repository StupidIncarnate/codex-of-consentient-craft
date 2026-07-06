/**
 * PURPOSE: Validates a non-relative (external / cross-package) import against the importing file's
 * folder rules. Cross-package imports are gated by folder type — from a subpath segment
 * (@scope/pkg/contracts) or the imported export-name suffix (main barrel) — not by package name.
 *
 * USAGE:
 * const isValid = validateExternalImportLayerBroker({ node, context, folderType, allowedImports, importSource });
 * // Returns true if the import is allowed, false if a violation was reported via context
 */
import type { EslintContext } from '../../../contracts/eslint-context/eslint-context-contract';
import type { Tsestree } from '../../../contracts/tsestree/tsestree-contract';
import type { FolderType } from '@dungeonmaster/shared/contracts';
import { isTestFileGuard } from '../../../guards/is-test-file/is-test-file-guard';
import { isStubFileGuard } from '../../../guards/is-stub-file/is-stub-file-guard';
import { importFolderTypeFromNameTransformer } from '../../../transformers/import-folder-type-from-name/import-folder-type-from-name-transformer';
import { importFolderTypeFromSubpathTransformer } from '../../../transformers/import-folder-type-from-subpath/import-folder-type-from-subpath-transformer';
import { nodeBuiltinStatics } from '../../../statics/node-builtin/node-builtin-statics';

export const validateExternalImportLayerBroker = ({
  node,
  context,
  folderType,
  allowedImports,
  importSource,
}: {
  node: Tsestree;
  context: EslintContext;
  folderType: FolderType;
  allowedImports: readonly string[];
  importSource: string;
}): boolean => {
  // Any `.../@types` subpath is allowed for all folders (type augmentation).
  if (importSource.includes('/@types')) {
    return true;
  }

  // Specific-package allowlist: exact package names / full subpaths in allowedImports
  // (react, @dungeonmaster/orchestrator, hono, zod, @dungeonmaster/shared/adapters, ...).
  // Folder entries (trailing '/') and node_modules are handled separately below.
  const isSpecificPackageAllowed = allowedImports.some((allowed: string) => {
    if (allowed === 'node_modules' || allowed.endsWith('/')) {
      return false;
    }
    return importSource === allowed || importSource.startsWith(`${allowed}/`);
  });

  if (isSpecificPackageAllowed) {
    return true;
  }

  const isTestFile = isTestFileGuard({ filename: context.filename ?? '' });
  const isCurrentFileStub = isStubFileGuard({ filename: context.filename ?? '' });

  // Test files may import @dungeonmaster/testing (workspace test infrastructure) — but NOT
  // contracts, which must come from a shared contracts barrel.
  const isDungeonmasterTesting =
    importSource === '@dungeonmaster/testing' || importSource.startsWith('@dungeonmaster/testing/');

  if (isTestFile && isDungeonmasterTesting) {
    const importsContract = node.specifiers?.some((specifier) => {
      const name = specifier.imported?.name;
      return typeof name === 'string' && name.endsWith('Contract');
    });

    if (importsContract === true) {
      context.report({
        node,
        messageId: 'forbiddenExternalImport',
        data: { folderType, packageName: importSource },
      });
      return false;
    }
    return true;
  }

  // Integration test files may import Node builtins (fs, path, crypto, etc.)
  const isIntegrationTest = (context.filename ?? '').includes('.integration.test.');
  const bareModule = importSource.startsWith('node:')
    ? importSource.slice('node:'.length)
    : importSource;

  if (isIntegrationTest && nodeBuiltinStatics.modules.some((mod) => mod === bareModule)) {
    return true;
  }

  // Cross-package subpath import (`@scope/pkg/contracts`, `pkg/adapters/x`): classify by the
  // folder-type segment and gate exactly like a local cross-folder import (node_modules does not
  // grant folder-typed access).
  const subpathFolderType = importFolderTypeFromSubpathTransformer({ importPath: importSource });

  if (subpathFolderType !== null) {
    // Test/stub files may always pull contracts (stubs) from another package's contracts barrel.
    if ((isTestFile || isCurrentFileStub) && subpathFolderType === 'contracts') {
      return true;
    }

    const isAllowed = allowedImports.some((allowed: string) => {
      if (allowed === 'node_modules') {
        return false;
      }
      if (allowed === importSource) {
        return true;
      }
      const folderName = allowed.endsWith('/') ? allowed.slice(0, -1) : allowed;
      return subpathFolderType === folderName;
    });

    if (!isAllowed) {
      context.report({
        node,
        messageId: 'forbiddenImport',
        data: { folderType, importedFolder: subpathFolderType, allowed: allowedImports.join(', ') },
      });
      return false;
    }
    return true;
  }

  // Main-barrel import (`@scope/pkg`, no folder-type subpath): classify each named import by its
  // export-name suffix. Allow only when every classifiable name is an allowed folder type; this is
  // an allow-only upgrade — anything else falls through to the external-import gate.
  const namedFolderTypes: FolderType[] = [];

  for (const specifier of node.specifiers ?? []) {
    const importedName = specifier.imported?.name;

    if (typeof importedName !== 'string') {
      continue;
    }

    const namedFolderType = importFolderTypeFromNameTransformer({ importName: importedName });

    if (namedFolderType !== null) {
      namedFolderTypes.push(namedFolderType);
    }
  }

  if (namedFolderTypes.length > 0) {
    const allNamedAllowed = namedFolderTypes.every((namedFolderType) =>
      allowedImports.some((allowed: string) => {
        if (allowed === 'node_modules') {
          return false;
        }
        const folderName = allowed.endsWith('/') ? allowed.slice(0, -1) : allowed;
        return namedFolderType === folderName;
      }),
    );

    if (allNamedAllowed) {
      return true;
    }
  }

  // External-package gate: adapters (node_modules) may import anything; otherwise forbidden.
  const canImportExternal = (allowedImports as readonly unknown[]).includes('node_modules');

  if (!canImportExternal) {
    context.report({
      node,
      messageId: 'forbiddenExternalImport',
      data: { folderType, packageName: importSource },
    });
    return false;
  }

  return true;
};
