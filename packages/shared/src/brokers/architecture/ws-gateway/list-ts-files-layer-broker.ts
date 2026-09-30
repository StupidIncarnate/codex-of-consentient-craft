/**
 * PURPOSE: Recursively lists all non-test TypeScript source files under a given directory
 *
 * USAGE:
 * const files = listTsFilesLayerBroker({
 *   dirPath: absoluteFilePathContract.parse('/repo/packages'),
 * });
 * // Returns AbsoluteFilePath[] for every .ts file passing isNonTestFileGuard
 *
 * WHEN-TO-USE: WS-edges broker collecting source files to scan for emit/consume calls
 */

import { isNonTestFileGuard } from '../../../guards/is-non-test-file/is-non-test-file-guard';
import { listTsFilesSkipDirsStatics } from '../../../statics/list-ts-files-skip-dirs/list-ts-files-skip-dirs-statics';
import { safeReaddirLayerBroker } from './safe-readdir-layer-broker';

export const listTsFilesLayerBroker = ({
  dirPath,
}: {
  dirPath: string;
}): string[] => {
  const entries = safeReaddirLayerBroker({ dirPath });
  const results: string[] = [];
  for (const entry of entries) {
    const entryPath = `${String(dirPath)}/${entry.name}`;
    if (entry.kind === 'directory') {
      if (listTsFilesSkipDirsStatics.skipDirNames.some((n) => n === entry.name)) continue;
      const children = listTsFilesLayerBroker({ dirPath: entryPath });
      for (const child of children) {
        results.push(child);
      }
    } else if (
      (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) &&
      isNonTestFileGuard({ filePath: entryPath })
    ) {
      results.push(entryPath);
    }
  }
  return results;
};
