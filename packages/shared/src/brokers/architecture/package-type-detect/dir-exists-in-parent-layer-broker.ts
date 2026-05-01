/**
 * PURPOSE: Checks whether a named directory exists by looking for it in the parent directory listing
 *
 * USAGE:
 * const exists = dirExistsInParentLayerBroker({
 *   parentDirPath: absoluteFilePathContract.parse('/project/src/responders'),
 *   dirName: 'hook',
 * });
 * // Returns true if 'hook' directory exists under responders/
 *
 * WHEN-TO-USE: During package-type detection to verify presence of named subdirectories
 */

import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import { safeReaddirLayerBroker } from './safe-readdir-layer-broker';

export const dirExistsInParentLayerBroker = ({
  parentDirPath,
  dirName,
}: {
  parentDirPath: AbsoluteFilePath;
  dirName: string;
}): boolean => {
  const entries = safeReaddirLayerBroker({ dirPath: parentDirPath });
  return entries.some((entry) => entry.isDirectory() && entry.name === dirName);
};
