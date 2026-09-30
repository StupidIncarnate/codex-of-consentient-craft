/**
 * PURPOSE: Reads package.json from a package directory and extracts the description field
 *
 * USAGE:
 * const desc = readPackageDescriptionLayerBroker({ packageJsonPath: '/project/packages/web/package.json' });
 * // Returns ContentText description or empty string if unavailable
 *
 * WHEN-TO-USE: When building the project map header line for a package
 */

import { readFileSync } from '#gateway/node/fs';
import { packageJsonContract } from '../../../contracts/package-json/package-json-contract';

export const readPackageDescriptionLayerBroker = ({
  packageJsonPath,
}: {
  packageJsonPath: string;
}): string => {
  try {
    const raw = readFileSync(packageJsonPath);
    const packageJson = packageJsonContract.parse(JSON.parse(raw));

    return packageJson.description ?? '';
  } catch {
    return '';
  }
};
