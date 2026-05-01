/**
 * PURPOSE: Returns the number of bin entries in a package.json
 *
 * USAGE:
 * binEntryCountLayerBroker({ packageJson: PackageJsonStub({ bin: { dungeonmaster: './dist/bin.js' } }) });
 * // Returns: 1 as FileCount
 *
 * WHEN-TO-USE: During package-type detection to distinguish cli-tool (1 bin entry) from hook-handlers (2+ entries)
 */

import type { PackageJson } from '../../../contracts/package-json/package-json-contract';
import { fileCountContract } from '../../../contracts/file-count/file-count-contract';
import type { FileCount } from '../../../contracts/file-count/file-count-contract';

export const binEntryCountLayerBroker = ({
  packageJson,
}: {
  packageJson: PackageJson;
}): FileCount => {
  const { bin } = packageJson;
  if (bin === undefined) {
    return fileCountContract.parse(0);
  }
  if (typeof bin === 'string') {
    return fileCountContract.parse(1);
  }
  return fileCountContract.parse(Object.keys(bin).length);
};
