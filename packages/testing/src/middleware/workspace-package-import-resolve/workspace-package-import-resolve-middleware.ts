/**
 * PURPOSE: Resolves a workspace package's subpath import (`@dungeonmaster/bin/testing`) to the
 * exporting package's `source` file — walking up to the workspaces root, scanning its `packages/*`
 * siblings for the one whose own package.json carries that name, then matching the subpath against
 * ITS `exports` map. Needs no build: every step reads package.json/source files directly, the way
 * Node's own `exports` "source" condition would, without requiring `dist/` to exist first.
 *
 * USAGE:
 * const filePath = workspacePackageImportResolveMiddleware({
 *   sourceFilePath: filePathContract.parse('/repo/packages/siegelense/src/a.proxy.ts'),
 *   importPath: importPathContract.parse('@dungeonmaster/bin/testing'),
 * });
 * // Returns FilePath ('/repo/packages/bin/src/testing/index.ts') or null
 */

import { fsExistsAdapter } from '../../adapters/fs/exists/fs-exists-adapter';
import { fsReaddirAdapter } from '../../adapters/fs/readdir/fs-readdir-adapter';
import { pathDirnameAdapter } from '../../adapters/path/dirname/path-dirname-adapter';
import { pathJoinAdapter } from '../../adapters/path/join/path-join-adapter';
import { packageSpecifierSplitTransformer } from '../../transformers/package-specifier-split/package-specifier-split-transformer';
import { workspacePackageExportSourceTransformer } from '../../transformers/workspace-package-export-source/workspace-package-export-source-transformer';
import { workspacePackageJsonReadMiddleware } from '../workspace-package-json-read/workspace-package-json-read-middleware';
import { workspaceRootFindMiddleware } from '../workspace-root-find/workspace-root-find-middleware';
import type { FilePath } from '../../contracts/file-path/file-path-contract';
import type { ImportPath } from '../../contracts/import-path/import-path-contract';

export const workspacePackageImportResolveMiddleware = ({
  sourceFilePath,
  importPath,
}: {
  sourceFilePath: FilePath;
  importPath: ImportPath;
}): FilePath | null => {
  const specifierParts = packageSpecifierSplitTransformer({ importPath });
  if (!specifierParts) {
    return null;
  }

  const workspaceRoot = workspaceRootFindMiddleware({
    dirPath: pathDirnameAdapter({ filePath: sourceFilePath }),
  });
  if (!workspaceRoot) {
    return null;
  }

  const packagesDirPath = pathJoinAdapter({ paths: [workspaceRoot, 'packages'] });

  for (const folderName of fsReaddirAdapter({ dirPath: packagesDirPath })) {
    const packageDirPath = pathJoinAdapter({ paths: [packagesDirPath, folderName] });
    const packageJson = workspacePackageJsonReadMiddleware({
      packageJsonPath: pathJoinAdapter({ paths: [packageDirPath, 'package.json'] }),
    });
    if (!packageJson || packageJson.name !== specifierParts.packageName) {
      continue;
    }

    const source = workspacePackageExportSourceTransformer({
      exportsMap: packageJson.exports,
      subpath: specifierParts.subpath,
    });
    if (!source) {
      continue;
    }

    const resolvedSourcePath = pathJoinAdapter({ paths: [packageDirPath, source] });
    return fsExistsAdapter({ filePath: resolvedSourcePath }) ? resolvedSourcePath : null;
  }

  return null;
};
