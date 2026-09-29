/**
 * PURPOSE: Validates a non-relative (external / cross-package) import against the importing file's
 * folder rules. Cross-package imports are gated by folder type — from a subpath segment
 * (@scope/pkg/contracts) or the imported export-name suffix (main barrel) — not by package name.
 *
 * USAGE:
 * const isValid = validateExternalImportLayerBroker({ node, context, folderType, allowedImports, importSource });
 * // Returns true if the import is allowed, false if a violation was reported via context
 */
import { AST_NODE_TYPES } from '#gateway/npm/typescript-eslint__utils';
import type { TSESLint, TSESTree } from '#gateway/npm/typescript-eslint__utils';
import type { FolderType } from '@dungeonmaster/shared/contracts';
import { isTestFileGuard } from '../../../guards/is-test-file/is-test-file-guard';
import { isStubFileGuard } from '../../../guards/is-stub-file/is-stub-file-guard';
import { importFolderTypeFromNameTransformer } from '../../../transformers/import-folder-type-from-name/import-folder-type-from-name-transformer';
import { importFolderTypeFromSubpathTransformer } from '../../../transformers/import-folder-type-from-subpath/import-folder-type-from-subpath-transformer';
import { builtinModules } from '#gateway/node/module';
import { gatewayLocationsStatics } from '@dungeonmaster/shared/statics';

export const validateExternalImportLayerBroker = ({
  node,
  context,
  folderType,
  allowedImports,
  importSource,
}: {
  node: TSESTree.Node;
  context: TSESLint.RuleContext<string, unknown[]>;
  folderType: FolderType;
  allowedImports: readonly string[];
  importSource: string;
}): boolean => {
  // Any `.../@types` subpath is allowed for all folders (type augmentation).
  if (importSource.includes('/@types')) {
    return true;
  }

  // Every gateway package (@dungeonmaster/npm, @dungeonmaster/node, @dungeonmaster/browser,
  // @dungeonmaster/bin), and any of their subpaths, is importable from any folder type. The
  // gateway is the sole boundary where an outside npm package, a Node module or global, a
  // browser global, or a spawned program is touched directly — it replaces the `adapters/`
  // folder type for that purpose, so it needs the same universal reach `node_modules` grants
  // `adapters/` today, without actually being `node_modules`. The `#gateway/<folder>` form
  // (gatewayLocationsStatics.importPrefix) is the same boundary reached through the
  // `imports`-field alias every consumer repo resolves identically, so it gets the same reach.
  const isGatewayImport = Object.values(gatewayLocationsStatics.folders).some(
    (gatewayFolder) =>
      importSource === `@dungeonmaster/${gatewayFolder}` ||
      importSource.startsWith(`@dungeonmaster/${gatewayFolder}/`) ||
      importSource === `${gatewayLocationsStatics.importPrefix}/${gatewayFolder}` ||
      importSource.startsWith(`${gatewayLocationsStatics.importPrefix}/${gatewayFolder}/`),
  );

  if (isGatewayImport) {
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

  const isTestFile = isTestFileGuard({ filename: context.filename });
  const isCurrentFileStub = isStubFileGuard({ filename: context.filename });

  // Test files may import @dungeonmaster/testing (workspace test infrastructure) — but NOT
  // contracts, which must come from a shared contracts barrel.
  const isDungeonmasterTesting =
    importSource === '@dungeonmaster/testing' || importSource.startsWith('@dungeonmaster/testing/');

  if (isTestFile && isDungeonmasterTesting) {
    const importsContract =
      (node.type === AST_NODE_TYPES.ImportDeclaration ||
        node.type === AST_NODE_TYPES.ExportNamedDeclaration) &&
      node.specifiers.some(
        (specifier) =>
          specifier.type === AST_NODE_TYPES.ImportSpecifier &&
          specifier.imported.type === AST_NODE_TYPES.Identifier &&
          specifier.imported.name.endsWith('Contract'),
      );

    if (importsContract) {
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
  const isIntegrationTest = context.filename.includes('.integration.test.');
  const bareModule = importSource.startsWith('node:')
    ? importSource.slice('node:'.length)
    : importSource;

  if (isIntegrationTest && builtinModules.some((mod) => mod === bareModule)) {
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

  const specifiers =
    node.type === AST_NODE_TYPES.ImportDeclaration ||
    node.type === AST_NODE_TYPES.ExportNamedDeclaration
      ? node.specifiers
      : [];

  for (const specifier of specifiers) {
    if (
      specifier.type !== AST_NODE_TYPES.ImportSpecifier ||
      specifier.imported.type !== AST_NODE_TYPES.Identifier
    ) {
      continue;
    }

    const importedName = specifier.imported.name;

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
