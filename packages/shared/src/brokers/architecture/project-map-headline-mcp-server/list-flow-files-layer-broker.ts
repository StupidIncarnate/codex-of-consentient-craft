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
 * WHEN-TO-USE: mcp-server headline broker discovering flow files for tool registration extraction
 */

import { absoluteFilePathContract } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import { isNonTestFileGuard } from '../../../guards/is-non-test-file/is-non-test-file-guard';
import { safeReaddirLayerBroker } from './safe-readdir-layer-broker';

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

    const entries = safeReaddirLayerBroker({ dirPath: current });
    for (const entry of entries) {
      const entryPath = absoluteFilePathContract.parse(`${String(current)}/${entry.name}`);
      if (entry.isDirectory()) {
        stack.push(entryPath);
      } else if (entry.name.endsWith('-flow.ts') && isNonTestFileGuard({ filePath: entryPath })) {
        results.push(entryPath);
      }
    }
  }

  return results;
};
