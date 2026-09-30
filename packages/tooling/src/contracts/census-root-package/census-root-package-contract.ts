/**
 * PURPOSE: The one field of a package.json the census reads: its `name`. The root's name gives the
 * workspace scope; each package's name is what other packages import it by. Every other field is
 * dropped, so a package.json shape the census does not know about never fails a run.
 *
 * USAGE:
 * censusRootPackageContract.parse({ name: '@acme/app', version: '1.0.0' });
 * // Returns: { name: '@acme/app' }
 */
import { z } from '#gateway/npm/zod';

export const censusRootPackageContract = z
  .object({
    name: z.string().min(1).brand<'CensusRootPackageName'>().optional(),
  })
  .brand<'CensusRootPackage'>();

export type CensusRootPackage = z.infer<typeof censusRootPackageContract>;
