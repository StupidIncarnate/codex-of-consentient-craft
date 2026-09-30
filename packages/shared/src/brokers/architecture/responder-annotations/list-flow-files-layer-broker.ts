/**
 * PURPOSE: Lists all non-test flow files (ending in -flow.ts) under a package's src/flows/
 * directory recursively using an iterative stack approach.
 *
 * USAGE:
 * const files = listFlowFilesLayerBroker({
 *   packageRoot: '/repo/packages/mcp',
 * });
 * // Returns AbsoluteFilePath[] of every *-flow.ts file under src/flows/
 *
 * WHEN-TO-USE: mcp-tools annotation extractor discovering flow files for tool registration scan
 */

import { isNonTestFileGuard } from '../../../guards/is-non-test-file/is-non-test-file-guard';
import { readdirEntriesSync } from '#gateway/node/fs';

export const listFlowFilesLayerBroker = ({ packageRoot }: { packageRoot: string }): string[] => {
  const flowsDir = `${packageRoot}/src/flows`;
  const stack: string[] = [flowsDir];
  const results: string[] = [];

  while (stack.length > 0) {
    const current = stack.pop();
    if (current === undefined) break;

    try {
      const entries = readdirEntriesSync(current);
      for (const entry of entries) {
        const entryPath = `${current}/${entry.name}`;
        if (entry.kind === 'directory') {
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
