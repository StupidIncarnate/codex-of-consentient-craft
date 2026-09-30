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

import { safeReaddirLayerBroker } from './safe-readdir-layer-broker';

export const dirExistsInParentLayerBroker = ({
  parentDirPath,
  dirName,
}: {
  parentDirPath: string;
  dirName: string;
}): boolean => {
  const entries = safeReaddirLayerBroker({ dirPath: parentDirPath });
  return entries.some((entry) => entry.kind === 'directory' && entry.name === dirName);
};
