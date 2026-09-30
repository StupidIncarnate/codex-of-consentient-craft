/**
 * PURPOSE: Reads package.json from a package directory and extracts the description field
 *
 * USAGE:
 * const desc = readPackageDescriptionLayerBroker({ packageJsonPath: absoluteFilePathContract.parse('/project/packages/web/package.json') });
 * // Returns ContentText description or empty string if unavailable
 *
 * WHEN-TO-USE: When building the project map header line for a package
 */

import { readFileSync } from '#gateway/node/fs';
import type { ContentText } from '../../../contracts/content-text/content-text-contract';
import { packageJsonContract } from '../../../contracts/package-json/package-json-contract';
import { contentTextContract } from '../../../contracts/content-text/content-text-contract';

export const readPackageDescriptionLayerBroker = ({
  packageJsonPath,
}: {
  packageJsonPath: string;
}): ContentText => {
  try {
    const raw = readFileSync(packageJsonPath);
    const packageJson = packageJsonContract.parse(JSON.parse(raw));

    return packageJson.description ?? contentTextContract.parse('');
  } catch {
    return contentTextContract.parse('');
  }
};
