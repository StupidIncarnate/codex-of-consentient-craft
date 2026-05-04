/**
 * PURPOSE: Lists all non-test flow files (ending in -flow.ts) under a package's src/flows/
 * directory recursively using an iterative stack approach.
 *
 * USAGE:
 * const files = listFlowFilesLayerBroker({
 *   packageRoot: absoluteFilePathContract.parse('/repo/packages/mcp'),
 * });
 * // Returns AbsoluteFilePath[] of every *-flow.ts file under src/flows/
 *
 * WHEN-TO-USE: mcp-tools annotation extractor discovering flow files for tool registration scan
 */

import { absoluteFilePathContract } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import { isNonTestFileGuard } from '../../../guards/is-non-test-file/is-non-test-file-guard';
import { fsReaddirWithTypesAdapter } from '../../../adapters/fs/readdir-with-types/fs-readdir-with-types-adapter';

export const listFlowFilesLayerBroker = ({
  packageRoot,
}: {
  packageRoot: AbsoluteFilePath;
}): AbsoluteFilePath[] => {
  const flowsDir = absoluteFilePathContract.parse(`${String(packageRoot)}/src/flows`);
  const stack: AbsoluteFilePath[] = [flowsDir];
  const results: AbsoluteFilePath[] = [];

  while (stack.length > 0) {
    const current = stack.pop();
    if (current === undefined) break;

    try {
      const entries = fsReaddirWithTypesAdapter({ dirPath: current });
      for (const entry of entries) {
        const entryPath = absoluteFilePathContract.parse(`${String(current)}/${entry.name}`);
        if (entry.isDirectory()) {
          stack.push(entryPath);
        } else if (entry.name.endsWith('-flow.ts') && isNonTestFileGuard({ filePath: entryPath })) {
          results.push(entryPath);
        }
      }
    } catch {
      // missing directory — skip and continue with the next stack frame
    }
  }

  return results;
};
