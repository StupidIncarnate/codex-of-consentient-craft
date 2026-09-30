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

export const binEntryCountLayerBroker = ({ packageJson }: { packageJson: PackageJson }): number => {
  const { bin } = packageJson;
  if (bin === undefined) {
    return 0;
  }
  if (typeof bin === 'string') {
    return 1;
  }
  return Object.keys(bin).length;
};
