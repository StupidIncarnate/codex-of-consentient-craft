/**
 * PURPOSE: The name of a third-party npm package one `packages/@gateway/*` package's own
 * `dependencies`/`peerDependencies` declares — branded standalone so `duplicateInstallViolationContract`
 * shares the exact same brand instead of a second independent `.brand()` call drifting apart.
 *
 * USAGE:
 * duplicateInstallPackageNameContract.parse('@mantine/core');
 * // Returns branded DuplicateInstallPackageName
 */

import { z } from 'zod';

export const duplicateInstallPackageNameContract = z
  .string()
  .min(1)
  .brand<'DuplicateInstallPackageName'>();

export type DuplicateInstallPackageName = z.infer<typeof duplicateInstallPackageNameContract>;
