/**
 * PURPOSE: The `bin` field of an installed package's package.json — one entry script, or a map from
 * binary name to entry script. Reach for this over shared's packageJsonContract when the only question
 * is which file a named binary runs.
 *
 * USAGE:
 * packageBinManifestContract.safeParse(JSON.parse(manifestText));
 * // Succeeds on { bin: { 'dungeonmaster-ward': './dist/bin/ward-entry.js' } }
 */

import { z } from '#gateway/npm/zod';

export const packageBinManifestContract = z
  .object({
    bin: z
      .union([
        z.string().min(1).brand<'PackageBinManifestBin'>(),
        z.record(z.string(), z.string().min(1).brand<'PackageBinManifestBin'>()),
      ])
      .optional(),
  })
  .brand<'PackageBinManifest'>();

export type PackageBinManifest = z.infer<typeof packageBinManifestContract>;
