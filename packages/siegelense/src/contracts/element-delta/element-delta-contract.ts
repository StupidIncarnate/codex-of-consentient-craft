/**
 * PURPOSE: The shape of what changed between two key readings of the same page — every element that
 * APPEARED, every one that DISAPPEARED, and every one that persisted but whose content CHANGED. Reach
 * for this over comparing two `KeyListing`s by hand: a raw two-array diff has no notion of "the same
 * element" across readings, and the element identity that makes one possible already exists at
 * `key-read-layer-adapter.ts:322-323` — `${row.parentRef}::${row.testId ?? '(' + row.tag + ')'}`.
 *
 * `changed` carries the WHOLE before/after `KeyRow`, not a field-level diff: a partial diff would need
 * its own contract per field and would still lose context a reader wants — what else was true of this
 * row when it changed. Matching two rows across readings never compares `ref` — `ref-contract.ts`
 * documents it as good for ONE instance in ONE page state, and `attrs-budget-transformer.ts` documents
 * the same fragility for a framework's per-mount id: either one differing between otherwise-identical
 * readings would make an unchanged page report churn.
 *
 * There is no `moved` and no `unchanged` field. `moved` is a comparison this shape does not attempt —
 * an element whose identity's own scope changed reads as one disappearance and one appearance, which is
 * the accurate report unless a later unit reconciles the pair. `unchanged` is answerable by absence
 * from all three arrays and does not need a field of its own.
 *
 * USAGE:
 * elementDeltaContract.parse({ appeared: [], disappeared: [], changed: [] });
 * // Returns a validated ElementDelta reporting no difference between two readings
 */

import { z } from 'zod';

import { keyRowContract } from '../key-row/key-row-contract';

export const elementDeltaContract = z
  .object({
    appeared: z.array(keyRowContract).readonly(),
    disappeared: z.array(keyRowContract).readonly(),
    changed: z
      .array(
        z
          .object({
            before: keyRowContract,
            after: keyRowContract,
          })
          .strict(),
      )
      .readonly(),
  })
  .strict();

export type ElementDelta = z.infer<typeof elementDeltaContract>;
