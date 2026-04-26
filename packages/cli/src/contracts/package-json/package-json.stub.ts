/**
 * PURPOSE: Create stub PackageJson instances for testing
 *
 * USAGE:
 * const pkg = PackageJsonStub();
 * // Returns a valid PackageJson instance with default devDependencies
 */

import { packageJsonContract, type PackageJson } from './package-json-contract';
import type { StubArgument } from '@dungeonmaster/shared/@types';

export const PackageJsonStub = ({ ...props }: StubArgument<PackageJson> = {}): PackageJson =>
  packageJsonContract.parse({
    name: 'test-package',
    devDependencies: { typescript: '^5.8.3' },
    ...props,
  });
