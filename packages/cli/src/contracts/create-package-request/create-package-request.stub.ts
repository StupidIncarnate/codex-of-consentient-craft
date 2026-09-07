/**
 * PURPOSE: Create stub CreatePackageRequest instances for testing
 *
 * USAGE:
 * const request = CreatePackageRequestStub();
 * // Returns valid CreatePackageRequest instance
 */

import {
  createPackageRequestContract,
  type CreatePackageRequest,
} from './create-package-request-contract';
import type { StubArgument } from '@dungeonmaster/shared/@types';

export const CreatePackageRequestStub = ({
  ...props
}: StubArgument<CreatePackageRequest> = {}): CreatePackageRequest =>
  createPackageRequestContract.parse({
    packageName: '@acme/widgets',
    directoryName: 'widgets',
    packageType: 'library',
    description: 'Widgets package',
    packagesDir: 'packages',
    ...props,
  });
