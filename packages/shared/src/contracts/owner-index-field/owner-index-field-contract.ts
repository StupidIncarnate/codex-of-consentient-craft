/**
 * PURPOSE: One top-level key of an object contract and how that key gets its value: a brand it
 * declares itself, a reuse of another contract's field through `.shape.key`, a reference to a
 * standalone brand contract, a reference to some other contract, or a plain schema. Reach for this
 * over the schema text when a rule must tell "declares its own brand" from "reuses an owner's".
 *
 * USAGE:
 * ownerIndexFieldContract.parse({ key: 'id', kind: 'own-brand', brandText: 'QuestId' });
 * // Returns: OwnerIndexField validated object
 */

import { z } from '#gateway/npm/zod';

import { identifierContract } from '../identifier/identifier-contract';

export const ownerIndexFieldContract = z.object({
  key: identifierContract,
  kind: z.enum(['own-brand', 'owner-reuse', 'brand-ref', 'contract-ref', 'plain']),
  brandText: identifierContract.optional(),
  refContractName: identifierContract.optional(),
  refKey: identifierContract.optional(),
});

export type OwnerIndexField = z.infer<typeof ownerIndexFieldContract>;
