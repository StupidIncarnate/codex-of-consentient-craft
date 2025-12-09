/**
 * PURPOSE: Create stub PackageJson instances for testing
 *
 * USAGE:
 * const packageJson = PackageJsonStub({name: 'my-test-project'});
 * // Returns valid PackageJson instance
 */

import { packageJsonContract, type PackageJson } from './package-json-contract';
import type { StubArgument } from '@dungeonmaster/shared/@types';

export const PackageJsonStub = ({ ...props }: StubArgument<PackageJson> = {}): PackageJson =>
  packageJsonContract.parse({
    name: 'test-project',
    version: '1.0.0',
    scripts: {
      test: 'jest',
      lint: 'eslint',
      typecheck: 'tsc --noEmit',
    },
    ...props,
  });
