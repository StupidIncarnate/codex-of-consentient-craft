/**
 * PURPOSE: The one field the npm-gateway sync reads off an installed package's own package.json —
 * its `version` — to decide whether dungeonmaster's wrapper was built against the same major. Every
 * other key passes through untouched; a manifest with no `version` (a nested `dist/package.json`
 * holding only `type`) still parses, and counts as no version. Reach for `packageJsonContract` (shared) for a package.json
 * someone authored; this one is for a manifest npm installed.
 *
 * USAGE:
 * npmInstalledManifestContract.parse({ name: 'zod', version: '3.23.8' });
 * // Returns { name: 'zod', version: '3.23.8' } as NpmInstalledManifest
 */

import { z } from '#gateway/npm/zod';

export const npmInstalledManifestContract = z
  .object({
    version: z.string().min(1).brand<'NpmInstalledManifestVersion'>().optional(),
  })
  .loose()
  .brand<'NpmInstalledManifest'>();

export type NpmInstalledManifest = z.infer<typeof npmInstalledManifestContract>;
