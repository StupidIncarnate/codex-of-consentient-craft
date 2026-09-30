/**
 * PURPOSE: Reads and parses a package.json file from a package root, returning undefined
 * when the file does not exist or cannot be parsed.
 *
 * USAGE:
 * const pkgJson = readPackageJsonLayerBroker({
 *   packageRoot: '/repo/packages/hooks',
 * });
 * // Returns the parsed PackageJson object or undefined if missing/unparseable
 *
 * WHEN-TO-USE: responder-annotations brokers reading package.json for bin entry discovery
 */

import { readFileSync } from '#gateway/node/fs';
import {
  packageJsonContract,
  type PackageJson,
} from '../../../contracts/package-json/package-json-contract';

export const readPackageJsonLayerBroker = ({
  packageRoot,
}: {
  packageRoot: string;
}): PackageJson | undefined => {
  const filePath = `${packageRoot}/package.json`;
  try {
    const content = readFileSync(filePath);
    return packageJsonContract.parse(JSON.parse(content));
  } catch {
    return undefined;
  }
};
