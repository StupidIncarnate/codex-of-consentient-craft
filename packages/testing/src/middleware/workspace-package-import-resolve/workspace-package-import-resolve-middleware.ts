/**
 * PURPOSE: Resolves a workspace package's subpath import (`@dungeonmaster/bin/testing`) to the
 * exporting package's `source` file — walking up to the workspaces root, scanning every base
 * directory its own `workspaces` globs declare (`packages/*`, and `packages/@gateway/*` for a
 * group-folder package like `@dungeonmaster/npm`) for the sibling whose own package.json carries
 * that name, then matching the subpath against ITS `exports` map. Needs no build: every step reads
 * package.json/source files directly, the way Node's own `exports` "source" condition would,
 * without requiring `dist/` to exist first.
 *
 * USAGE:
 * const filePath = workspacePackageImportResolveMiddleware({
 *   sourceFilePath: filePathContract.parse('/repo/packages/siegelense/src/a.proxy.ts'),
 *   importPath: importPathContract.parse('@dungeonmaster/bin/testing'),
 * });
 * // Returns FilePath ('/repo/packages/bin/testing.ts') or null
 */

import { existsSync, readdirSync } from '#gateway/node/fs';
import { dirname, join } from '#gateway/node/path';
import { packageSpecifierSplitTransformer } from '../../transformers/package-specifier-split/package-specifier-split-transformer';
import { workspaceGlobBaseDirsTransformer } from '../../transformers/workspace-glob-base-dirs/workspace-glob-base-dirs-transformer';
import { workspacePackageExportSourceTransformer } from '../../transformers/workspace-package-export-source/workspace-package-export-source-transformer';
import { workspacePackageJsonReadMiddleware } from '../workspace-package-json-read/workspace-package-json-read-middleware';
import { workspaceRootFindMiddleware } from '../workspace-root-find/workspace-root-find-middleware';
import { filePathContract } from '../../contracts/file-path/file-path-contract';
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
    dirPath: filePathContract.parse(dirname(sourceFilePath)),
  });
  if (!workspaceRoot) {
    return null;
  }

  const rootPackageJson = workspacePackageJsonReadMiddleware({
    packageJsonPath: filePathContract.parse(join(workspaceRoot, 'package.json')),
  });
  const packagesBaseDirs = workspaceGlobBaseDirsTransformer({
    workspaces: rootPackageJson?.workspaces,
  });

  for (const packagesBaseDir of packagesBaseDirs) {
    const packagesDirPath = join(workspaceRoot, packagesBaseDir);

    for (const folderName of readdirSync(packagesDirPath)) {
      const packageDirPath = join(packagesDirPath, folderName);
      const packageJson = workspacePackageJsonReadMiddleware({
        packageJsonPath: filePathContract.parse(join(packageDirPath, 'package.json')),
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

      const resolvedSourcePath = filePathContract.parse(join(packageDirPath, source));
      return existsSync(resolvedSourcePath) ? resolvedSourcePath : null;
    }
  }

  return null;
};
