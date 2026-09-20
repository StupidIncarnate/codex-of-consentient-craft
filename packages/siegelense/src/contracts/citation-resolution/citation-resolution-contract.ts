/**
 * PURPOSE: The whole answer to "may this instance's evidence be taken" — every citation found,
 * every citation KIND that went unchecked, and `blocked`, the one field that says the question
 * could not be settled at all. Three states, not two: `references` non-empty is a refusal a caller
 * can explain, `blocked` non-null is a refusal a caller cannot yet explain but must still make, and
 * both empty with `gaps` listed is the only shape that permits a delete. Deleting is the one
 * irreversible thing this tool does, so "could not establish" resolves to keep, never to take.
 * Reach for this over reading `citationReferenceContract` alone: the array on its own cannot say
 * whether an empty list means nothing cites this or nothing was asked.
 *
 * USAGE:
 * citationResolutionContract.parse({ references: [], gaps: [], blocked: null });
 * // Returns a validated CitationResolution — an unowned instance, nothing citing it, nothing unasked
 */

import { z } from 'zod';

import { contentTextContract } from '@dungeonmaster/shared/contracts';

import { citationGapContract } from '../citation-gap/citation-gap-contract';
import { citationReferenceContract } from '../citation-reference/citation-reference-contract';

export const citationResolutionContract = z
  .object({
    references: z.array(citationReferenceContract).readonly(),
    gaps: z.array(citationGapContract).readonly(),
    blocked: contentTextContract.nullable(),
  })
  .strict();

export type CitationResolution = z.infer<typeof citationResolutionContract>;
