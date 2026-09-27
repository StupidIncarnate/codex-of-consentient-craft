/**
 * PURPOSE: Reads and parses a package.json file from a package root, returning undefined
 * when the file does not exist or cannot be parsed.
 *
 * USAGE:
 * const pkgJson = readPackageJsonLayerBroker({
 *   packageRoot: absoluteFilePathContract.parse('/repo/packages/hooks'),
 * });
 * // Returns the parsed PackageJson object or undefined if missing/unparseable
 *
 * WHEN-TO-USE: responder-annotations brokers reading package.json for bin entry discovery
 */

import { readFileSync } from '#gateway/node/fs';
import { absoluteFilePathContract } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import type { AbsoluteFilePath } from '../../../contracts/absolute-file-path/absolute-file-path-contract';
import {
  packageJsonContract,
  type PackageJson,
} from '../../../contracts/package-json/package-json-contract';

export const readPackageJsonLayerBroker = ({
  packageRoot,
}: {
  packageRoot: AbsoluteFilePath;
}): PackageJson | undefined => {
  const filePath = absoluteFilePathContract.parse(`${String(packageRoot)}/package.json`);
  try {
    const content = readFileSync(String(filePath));
    return packageJsonContract.parse(JSON.parse(content));
  } catch {
    return undefined;
  }
};
