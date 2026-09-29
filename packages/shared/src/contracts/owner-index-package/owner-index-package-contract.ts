/**
 * PURPOSE: A workspace package as the owner index sees it: its name, its directory and the
 * workspace packages it lists as dependencies. Reach for this over ContractIndexPackage when a
 * lookup must know which other packages' owners a file can import.
 *
 * USAGE:
 * ownerIndexPackageContract.parse({ name: '@repo/a', dir: '/repo/packages/a', dependencies: ['@repo/shared'] });
 * // Returns: OwnerIndexPackage validated object
 */

import { z } from '#gateway/npm/zod';

import { absoluteFilePathContract } from '../absolute-file-path/absolute-file-path-contract';
import { packageNameContract } from '../package-name/package-name-contract';

export const ownerIndexPackageContract = z.object({
  name: packageNameContract,
  dir: absoluteFilePathContract,
  dependencies: z.array(packageNameContract),
});

export type OwnerIndexPackage = z.infer<typeof ownerIndexPackageContract>;
