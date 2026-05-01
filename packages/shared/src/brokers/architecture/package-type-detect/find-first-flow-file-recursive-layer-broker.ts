/**
 * PURPOSE: Recursively finds the absolute path of the first flow file (*-flow.ts) within a directory tree
 *
 * USAGE:
 * const path = findFirstFlowFileRecursiveLayerBroker({ dirPath: absoluteFilePathContract.parse('/project/src/flows') });
 * // Returns '/project/src/flows/quest/quest-flow.ts' as AbsoluteFilePath or undefined if not found
 *
 * WHEN-TO-USE: During package-type detection to locate a flow file for content inspection
 */

import { absoluteFilePathContract } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import { matchesFlowFileNameGuard } from '../../../guards/matches-flow-file-name/matches-flow-file-name-guard';
import { safeReaddirLayerBroker } from './safe-readdir-layer-broker';

export const findFirstFlowFileRecursiveLayerBroker = ({
  dirPath,
}: {
  dirPath: AbsoluteFilePath;
}): AbsoluteFilePath | undefined => {
  const entries = safeReaddirLayerBroker({ dirPath });

  for (const entry of entries) {
    if (!entry.isDirectory() && matchesFlowFileNameGuard({ name: entry.name })) {
      return absoluteFilePathContract.parse(`${dirPath}/${entry.name}`);
    }

    if (entry.isDirectory()) {
      const childPath = absoluteFilePathContract.parse(`${dirPath}/${entry.name}`);
      const found = findFirstFlowFileRecursiveLayerBroker({ dirPath: childPath });
      if (found !== undefined) {
        return found;
      }
    }
  }

  return undefined;
};
