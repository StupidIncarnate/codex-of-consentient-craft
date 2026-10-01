/**
 * PURPOSE: The `ward` key a package may set in its own package.json, which is how one package tells
 * ward something only that package knows. Reach for this rather than the shared package.json
 * contract when the question is a ward setting: the shared contract describes npm's own fields.
 *
 * The `ward` object is strict, so a misspelt key is refused rather than read as "not set". A typo
 * such as `integrationbuild` would otherwise switch the build off with nothing saying so.
 *
 * USAGE:
 * packageWardSettingsContract.parse({ name: '@scope/cli', ward: { integrationBuild: true } });
 * // Returns PackageWardSettings, keeping every other package.json key as it was
 */

import { z } from '#gateway/npm/zod';

export const packageWardSettingsContract = z
  .object({
    ward: z
      .strictObject({
        integrationBuild: z.boolean().optional(),
      })
      .brand<'PackageWardSettingsWard'>()
      .optional(),
  })
  .loose()
  .brand<'PackageWardSettings'>();

export type PackageWardSettings = z.infer<typeof packageWardSettingsContract>;
