/**
 * PURPOSE: Resolves a `#`-specifier import (`#gateway/npm/glob/glob/glob.proxy`) to its target
 * workspace package's `source` file. Reads the IMPORTING file's own nearest package.json — not the
 * workspaces root — for its `imports` map, the same ancestor Node itself consults to resolve a
 * `#specifier` at runtime, matches the specifier against that map to get a target specifier
 * (`@dungeonmaster/npm/glob/glob/glob.proxy`), then resolves that target the same way any other
 * workspace-package subpath import resolves.
 *
 * USAGE:
 * const filePath = packageImportsSpecifierResolveMiddleware({
 *   sourceFilePath: filePathContract.parse('/repo/packages/mcp/src/brokers/file/scanner/file-scanner-broker.proxy.ts'),
 *   importPath: importPathContract.parse('#gateway/npm/glob/glob/glob.proxy'),
 * });
 * // Returns FilePath ('/repo/packages/@gateway/npm/src/glob/glob/glob.proxy.ts') or null
 */

import { dirname } from '#gateway/node/path';
import { nearestPackageJsonFindMiddleware } from '../nearest-package-json-find/nearest-package-json-find-middleware';
import { workspacePackageImportResolveMiddleware } from '../workspace-package-import-resolve/workspace-package-import-resolve-middleware';
import { workspacePackageImportsTargetTransformer } from '../../transformers/workspace-package-imports-target/workspace-package-imports-target-transformer';
import { filePathContract } from '../../contracts/file-path/file-path-contract';
import type { FilePath } from '../../contracts/file-path/file-path-contract';
import type { ImportPath } from '../../contracts/import-path/import-path-contract';

export const packageImportsSpecifierResolveMiddleware = ({
  sourceFilePath,
  importPath,
}: {
  sourceFilePath: FilePath;
  importPath: ImportPath;
}): FilePath | null => {
  const packageJson = nearestPackageJsonFindMiddleware({
    dirPath: filePathContract.parse(dirname(sourceFilePath)),
  });
  if (!packageJson) {
    return null;
  }

  const target = workspacePackageImportsTargetTransformer({
    importsMap: packageJson.imports,
    specifier: importPath,
  });
  if (!target) {
    return null;
  }

  return workspacePackageImportResolveMiddleware({ sourceFilePath, importPath: target });
};
