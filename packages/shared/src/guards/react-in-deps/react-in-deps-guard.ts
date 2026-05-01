/**
 * PURPOSE: Returns true when package.json dependencies include 'react'
 *
 * USAGE:
 * reactInDepsGuard({ packageJson: PackageJsonStub({ dependencies: { react: '18.0.0' } }) });
 * // Returns true — 'react' is in dependencies
 */

import type { PackageJson } from '../../contracts/package-json/package-json-contract';

export const reactInDepsGuard = ({ packageJson }: { packageJson?: PackageJson }): boolean => {
  if (packageJson === undefined) {
    return false;
  }
  const { dependencies } = packageJson;
  if (dependencies === undefined) {
    return false;
  }
  return Reflect.get(dependencies, 'react') !== undefined;
};
