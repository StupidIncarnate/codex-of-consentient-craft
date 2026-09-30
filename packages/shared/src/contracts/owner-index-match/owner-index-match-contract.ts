/**
 * PURPOSE: The answer to "who owns this name": the owning object contract and the key of it that
 * declares the brand. Reach for this over returning a bare owner name when the caller must also
 * read the key, the file or the inferred type to build `Owner['key']`.
 *
 * USAGE:
 * ownerIndexMatchContract.parse({ owner, field });
 * // Returns: OwnerIndexMatch validated object
 */

import { z } from '#gateway/npm/zod';

import { ownerIndexFieldContract } from '../owner-index-field/owner-index-field-contract';
import { ownerIndexOwnerContract } from '../owner-index-owner/owner-index-owner-contract';

export const ownerIndexMatchContract = z
  .object({
    owner: ownerIndexOwnerContract,
    field: ownerIndexFieldContract,
  })
  .brand<'OwnerIndexMatch'>();

export type OwnerIndexMatch = z.infer<typeof ownerIndexMatchContract>;
