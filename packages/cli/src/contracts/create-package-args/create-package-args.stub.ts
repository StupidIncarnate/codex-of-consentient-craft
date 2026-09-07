/**
 * PURPOSE: Create stub CreatePackageArgs instances for testing
 *
 * USAGE:
 * const args = CreatePackageArgsStub();
 * // Returns a valid CreatePackageArgs instance with a library package name and dryRun false
 */

import { createPackageArgsContract, type CreatePackageArgs } from './create-package-args-contract';
import type { StubArgument } from '@dungeonmaster/shared/@types';

export const CreatePackageArgsStub = ({
  ...props
}: StubArgument<CreatePackageArgs> = {}): CreatePackageArgs =>
  createPackageArgsContract.parse({
    name: '@acme/widgets',
    packageType: 'library',
    dryRun: false,
    ...props,
  });
