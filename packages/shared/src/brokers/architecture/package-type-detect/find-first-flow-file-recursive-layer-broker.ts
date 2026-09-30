/**
 * PURPOSE: Recursively finds the absolute path of the first flow file (*-flow.ts) within a directory tree
 *
 * USAGE:
 * const path = findFirstFlowFileRecursiveLayerBroker({ dirPath: '/project/src/flows' });
 * // Returns '/project/src/flows/quest/quest-flow.ts' as AbsoluteFilePath or undefined if not found
 *
 * WHEN-TO-USE: During package-type detection to locate a flow file for content inspection
 */

import { matchesFlowFileNameGuard } from '../../../guards/matches-flow-file-name/matches-flow-file-name-guard';
import { safeReaddirLayerBroker } from './safe-readdir-layer-broker';

export const findFirstFlowFileRecursiveLayerBroker = ({
  dirPath,
}: {
  dirPath: string;
}): string | undefined => {
  const entries = safeReaddirLayerBroker({ dirPath });

  for (const entry of entries) {
    if (entry.kind !== 'directory' && matchesFlowFileNameGuard({ name: entry.name })) {
      return `${dirPath}/${entry.name}`;
    }

    if (entry.kind === 'directory') {
      const childPath = `${dirPath}/${entry.name}`;
      const found = findFirstFlowFileRecursiveLayerBroker({ dirPath: childPath });
      if (found !== undefined) {
        return found;
      }
    }
  }

  return undefined;
};
