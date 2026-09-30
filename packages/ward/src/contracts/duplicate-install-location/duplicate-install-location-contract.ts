/**
 * PURPOSE: One place a duplicate-install candidate was actually found installed — a repo-root-relative
 * path to the `node_modules/<name>` directory that holds it, paired with the version its own
 * `package.json` reports. `duplicateInstallCheckBroker` builds one of these per location a name
 * resolves at; two or more for the same name is what makes a violation.
 *
 * USAGE:
 * duplicateInstallLocationContract.parse({location: 'packages/@gateway/npm/node_modules/@mantine/core', version: '8.3.18'});
 * // Returns: DuplicateInstallLocation
 */

import { z } from '#gateway/npm/zod';

export const duplicateInstallLocationContract = z.object({
  location: z.string().min(1).brand<'DuplicateInstallLocationLocation'>(),
  version: z.string().min(1).brand<'DuplicateInstallLocationVersion'>(),
}).brand<'DuplicateInstallLocation'>();

export type DuplicateInstallLocation = z.infer<typeof duplicateInstallLocationContract>;
