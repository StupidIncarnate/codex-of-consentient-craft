/**
 * PURPOSE: Resolves an import path to an absolute file path. A relative path resolves against its
 * importing file's own directory, trying this codebase's source extensions in order. A workspace
 * package subpath (`@dungeonmaster/bin/testing`, `@dungeonmaster/shared/testing`, …) delegates to
 * workspacePackageImportResolveMiddleware, which resolves it the way Node's own `exports` map would
 * under the `source` condition — without needing that package built first. A `#`-prefixed specifier
 * (`#gateway/npm/_test_`) delegates to packageImportsSpecifierResolveMiddleware instead, which reads
 * the IMPORTING package's own `imports` map (not workspace-wide) to find the target before that
 * target is itself resolved the same way.
 *
 * USAGE:
 * const filePath = importPathResolverMiddleware({
 *   sourceFilePath: filePathContract.parse('/src/test.test.ts'),
 *   importPath: importPathContract.parse('./test.proxy')
 * });
 * // Returns FilePath or null if file doesn't exist
 */

import { fileExtensionsStatics } from '@dungeonmaster/shared/statics';

import { pathDirnameAdapter } from '../../adapters/path/dirname/path-dirname-adapter';
import { pathResolveAdapter } from '../../adapters/path/resolve/path-resolve-adapter';
import { fsExistsSyncAdapter } from '../../adapters/fs/exists-sync/fs-exists-sync-adapter';
import { packageImportsSpecifierResolveMiddleware } from '../package-imports-specifier-resolve/package-imports-specifier-resolve-middleware';
import { workspacePackageImportResolveMiddleware } from '../workspace-package-import-resolve/workspace-package-import-resolve-middleware';
import { filePathContract } from '../../contracts/file-path/file-path-contract';
import type { FilePath } from '../../contracts/file-path/file-path-contract';
import type { ImportPath } from '../../contracts/import-path/import-path-contract';

const IMPORTS_MAP_SPECIFIER_PREFIX = '#';

export const importPathResolverMiddleware = ({
  sourceFilePath,
  importPath,
}: {
  sourceFilePath: FilePath;
  importPath: ImportPath;
}): FilePath | null => {
  if (importPath.startsWith(IMPORTS_MAP_SPECIFIER_PREFIX)) {
    return packageImportsSpecifierResolveMiddleware({ sourceFilePath, importPath });
  }

  if (!importPath.startsWith('.')) {
    return workspacePackageImportResolveMiddleware({ sourceFilePath, importPath });
  }

  const sourceDir = pathDirnameAdapter({ filePath: sourceFilePath });
  const resolved = pathResolveAdapter({ paths: [sourceDir, importPath] });

  // Try extensions in order of likelihood for this codebase
  for (const ext of fileExtensionsStatics.source.all) {
    const withExt = filePathContract.parse(`${resolved}${ext}`);
    if (fsExistsSyncAdapter({ filePath: withExt })) {
      return withExt;
    }
  }

  // Try without extension (already has extension)
  const asIs = filePathContract.parse(resolved);
  if (fsExistsSyncAdapter({ filePath: asIs })) {
    return asIs;
  }

  return null;
};
