/**
 * PURPOSE: Lists immediate subdirectory names under <packageRoot>/src/statics/ for use
 * in the statics-inline special case of the library headline renderer.
 *
 * USAGE:
 * const names = listStaticsFoldersLayerBroker({
 *   packageRoot: absoluteFilePathContract.parse('/repo/packages/shared'),
 * });
 * // Returns ContentText[] — folder names like ['project-map', 'mcp-tools', 'locations']
 * // Returns [] if the statics/ folder is missing
 *
 * WHEN-TO-USE: Library headline renderer listing static names when count < staticsInlineThreshold
 */

import { absoluteFilePathContract } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import {
  contentTextContract,
  type ContentText,
} from '../../../contracts/content-text/content-text-contract';
import { safeReaddirLayerBroker } from './safe-readdir-layer-broker';

export const listStaticsFoldersLayerBroker = ({
  packageRoot,
}: {
  packageRoot: AbsoluteFilePath;
}): ContentText[] => {
  const staticsDir = absoluteFilePathContract.parse(`${String(packageRoot)}/src/statics`);

  const entries = safeReaddirLayerBroker({ dirPath: staticsDir });

  const folderNames: ContentText[] = [];
  for (const entry of entries) {
    if (entry.isDirectory()) {
      folderNames.push(contentTextContract.parse(entry.name));
    }
  }
  return folderNames;
};
