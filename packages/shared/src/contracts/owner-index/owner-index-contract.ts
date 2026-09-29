/**
 * PURPOSE: The whole owner index: every object contract in the workspace with its keys, every
 * standalone brand contract, and each package's direct workspace dependencies. Reach for this over
 * ContractIndexEntry when the question is who owns a name or a field, not whether a contract is parsed.
 *
 * USAGE:
 * ownerIndexContract.parse({ owners: [], standaloneBrands: [], packages: [] });
 * // Returns: OwnerIndex validated object
 */

import { z } from '#gateway/npm/zod';

import { ownerIndexOwnerContract } from '../owner-index-owner/owner-index-owner-contract';
import { ownerIndexPackageContract } from '../owner-index-package/owner-index-package-contract';
import { ownerIndexStandaloneBrandContract } from '../owner-index-standalone-brand/owner-index-standalone-brand-contract';

export const ownerIndexContract = z.object({
  owners: z.array(ownerIndexOwnerContract),
  standaloneBrands: z.array(ownerIndexStandaloneBrandContract),
  packages: z.array(ownerIndexPackageContract),
});

export type OwnerIndex = z.infer<typeof ownerIndexContract>;
