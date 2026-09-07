/**
 * PURPOSE: Validates the raw, possibly-incomplete result of parsing `dungeonmaster create-package`'s
 * command-line flags. Reach for this over `createPackageRequestContract` wherever flags have been
 * read but the interactive prompt path has not yet filled the gaps.
 *
 * USAGE:
 * const args = createPackageArgsContract.parse({ name: '@acme/widgets', dryRun: false });
 * // Returns validated CreatePackageArgs with every field but dryRun optional
 */

import { z } from 'zod';

import {
  packageNameContract,
  packageTypeContract,
  contentTextContract,
  pathSegmentContract,
} from '@dungeonmaster/shared/contracts';

export const createPackageArgsContract = z.object({
  name: packageNameContract.optional(),
  packageType: packageTypeContract.optional(),
  description: contentTextContract.optional(),
  packagesDir: pathSegmentContract.optional(),
  dryRun: z.boolean().default(false),
});

export type CreatePackageArgs = z.infer<typeof createPackageArgsContract>;
