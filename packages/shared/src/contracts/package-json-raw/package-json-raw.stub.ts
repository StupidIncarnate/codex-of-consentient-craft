/**
 * PURPOSE: Create stub PackageJsonRaw instances for testing
 *
 * USAGE:
 * const pkg = PackageJsonRawStub({ name: 'x' });
 * // Returns valid PackageJsonRaw record
 */

import { packageJsonRawContract } from './package-json-raw-contract';
import type { PackageJsonRaw } from './package-json-raw-contract';
import type { StubArgument } from '../../@types/stub-argument.type';

export const PackageJsonRawStub = ({
  ...props
}: StubArgument<PackageJsonRaw> = {}): PackageJsonRaw =>
  packageJsonRawContract.parse({
    name: 'stub-project',
    version: '1.0.0',
    ...props,
  });
