/**
 * PURPOSE: Resolves an import path to an absolute file path using adapters
 *
 * USAGE:
 * const filePath = importPathResolverMiddleware({
 *   sourceFilePath: filePathContract.parse('/src/test.test.ts'),
 *   importPath: importPathContract.parse('./test.proxy')
 * });
 * // Returns FilePath or null if file doesn't exist
 */

import { pathDirnameAdapter } from '../../adapters/path/dirname/path-dirname-adapter';
import { pathResolveAdapter } from '../../adapters/path/resolve/path-resolve-adapter';
import { fsExistsSyncAdapter } from '../../adapters/fs/exists-sync/fs-exists-sync-adapter';
import { filePathContract } from '../../contracts/file-path/file-path-contract';
import type { FilePath } from '../../contracts/file-path/file-path-contract';
import type { ImportPath } from '../../contracts/import-path/import-path-contract';

export const importPathResolverMiddleware = ({
  sourceFilePath,
  importPath,
}: {
  sourceFilePath: FilePath;
  importPath: ImportPath;
}): FilePath | null => {
  // Handle @dungeonmaster/shared/testing barrel
  if (importPath === '@dungeonmaster/shared/testing') {
    try {
      // Use require.resolve to find the actual file path
      const resolved = require.resolve('@dungeonmaster/shared/testing');
      // Convert from .js to .ts (require.resolve returns dist path)
      const tsPath = resolved.replace('/dist/', '/').replace('.js', '.ts');
      const filePath = filePathContract.parse(tsPath);
      if (fsExistsSyncAdapter({ filePath })) {
        return filePath;
      }
    } catch {
      return null;
    }
    return null;
  }

  // Handle relative imports
  if (!importPath.startsWith('.')) {
    return null;
  }

  const sourceDir = pathDirnameAdapter({ filePath: sourceFilePath });
  const resolved = pathResolveAdapter({ paths: [sourceDir, importPath] });

  // Try with .ts extension
  const withExtension = filePathContract.parse(`${resolved}.ts`);
  if (fsExistsSyncAdapter({ filePath: withExtension })) {
    return withExtension;
  }

  // Try without extension (already has .ts)
  const asIs = filePathContract.parse(resolved);
  if (fsExistsSyncAdapter({ filePath: asIs })) {
    return asIs;
  }

  return null;
};
