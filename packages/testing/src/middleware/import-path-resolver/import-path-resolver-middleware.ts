/**
 * PURPOSE: Resolves an import path to an absolute file path. A relative path resolves against its
 * importing file's own directory, trying this codebase's source extensions in order. A workspace
 * package subpath (`@dungeonmaster/bin/testing`, `@dungeonmaster/shared/testing`, …) delegates to
 * workspacePackageImportResolveMiddleware, which resolves it the way Node's own `exports` map would
 * under the `source` condition — without needing that package built first. A `#`-prefixed specifier
 * (`#gateway/npm/glob/glob/glob.proxy`) delegates to packageImportsSpecifierResolveMiddleware instead,
 * which reads the IMPORTING package's own `imports` map (not workspace-wide) to find the target
 * before that target is itself resolved the same way.
 *
 * USAGE:
 * const filePath = importPathResolverMiddleware({
 *   sourceFilePath: '/src/test.test.ts',
 *   importPath: './test.proxy'
 * });
 * // Returns FilePath or null if file doesn't exist
 */

import { fileExtensionsStatics } from '@dungeonmaster/shared/statics';

import { existsSync } from '#gateway/node/fs';
import { dirname, resolve } from '#gateway/node/path';
import { packageImportsSpecifierResolveMiddleware } from '../package-imports-specifier-resolve/package-imports-specifier-resolve-middleware';
import { workspacePackageImportResolveMiddleware } from '../workspace-package-import-resolve/workspace-package-import-resolve-middleware';

const IMPORTS_MAP_SPECIFIER_PREFIX = '#';

export const importPathResolverMiddleware = ({
  sourceFilePath,
  importPath,
}: {
  sourceFilePath: string;
  importPath: string;
}): string | null => {
  if (importPath.startsWith(IMPORTS_MAP_SPECIFIER_PREFIX)) {
    return packageImportsSpecifierResolveMiddleware({ sourceFilePath, importPath });
  }

  if (!importPath.startsWith('.')) {
    return workspacePackageImportResolveMiddleware({ sourceFilePath, importPath });
  }

  const sourceDir = dirname(sourceFilePath);
  const resolved = resolve(sourceDir, importPath);

  // Try extensions in order of likelihood for this codebase
  for (const ext of fileExtensionsStatics.source.all) {
    const withExt = `${resolved}${ext}`;
    if (existsSync(withExt)) {
      return withExt;
    }
  }

  // Try without extension (already has extension)
  const asIs = resolved;
  if (existsSync(asIs)) {
    return asIs;
  }

  return null;
};
