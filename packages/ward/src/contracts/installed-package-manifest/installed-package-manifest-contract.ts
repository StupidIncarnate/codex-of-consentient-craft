/**
 * PURPOSE: The subset of an installed copy's own `package.json` `installedPackageVersionReadOptionalLayerBroker`
 * reads — just `version`, left optional because a real `package.json` sometimes omits it (a workspace
 * symlink target, a git-dependency checkout) and an absent field there means "unknown", not "not installed".
 *
 * USAGE:
 * installedPackageManifestContract.parse({version: '8.3.18', name: '@mantine/core'});
 * // Returns: InstalledPackageManifest, version '8.3.18'
 */

import { z } from '#gateway/npm/zod';

export const installedPackageManifestContract = z
  .object({ version: z.string().min(1).brand<'InstalledPackageManifestVersion'>().optional() })
  .loose()
  .brand<'InstalledPackageManifest'>();

export type InstalledPackageManifest = z.infer<typeof installedPackageManifestContract>;
