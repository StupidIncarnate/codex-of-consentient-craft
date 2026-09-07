/**
 * PURPOSE: The completed scaffold request handed to the file-building transformer — every question
 * answered, whether by a flag or an interactive prompt, so nothing downstream re-decides a default.
 * Reach for this over `createPackageArgsContract` once every field has an answer; that sibling holds
 * the same fields still optional, straight off the command line, before any prompt has run.
 *
 * USAGE:
 * createPackageRequestContract.parse({
 *   packageName: '@acme/widgets',
 *   directoryName: 'widgets',
 *   packageType: 'library',
 *   description: 'Widgets package',
 *   packagesDir: 'packages',
 * });
 * // Returns: CreatePackageRequest object
 */

import { z } from 'zod';
import {
  packageNameContract,
  packageTypeContract,
  contentTextContract,
  pathSegmentContract,
} from '@dungeonmaster/shared/contracts';

export const createPackageRequestContract = z.object({
  packageName: packageNameContract,
  directoryName: pathSegmentContract,
  packageType: packageTypeContract,
  description: contentTextContract,
  packagesDir: pathSegmentContract,
});

export type CreatePackageRequest = z.infer<typeof createPackageRequestContract>;
