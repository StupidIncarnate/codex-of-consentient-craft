/**
 * PURPOSE: The rows a `filter` matched, which exist only at RUN time. Reach for this over a
 * collection wherever the count is a fact about the gates rather than about the recipe — it has no
 * index and no `add`, and the type is the statement. The identity data is the ingredient filtered
 * and `matchedRef`, the placeholder ref the runner replays the filter's nested ops against; `set`,
 * `setRaw`, `saveRecordAs`, `remove` and the ingredient's own extras arrive by intersection.
 *
 * USAGE:
 * matchedSetContract.parse({ ingredient: 'operation', matchedRef: 'operation[match]' });
 * // Returns MatchedSetData
 */
import { z } from '#gateway/npm/zod';
import { rowRefContract } from '../row-ref/row-ref-contract';
import type { RowVerbs, ExtraMethods } from '../ingredient-handle/ingredient-handle-contract';

export const matchedSetContract = z.object({
  ingredient: z.string().min(1).regex( /^[A-Za-z][A-Za-z0-9-]*$/u, 'must start with a letter and hold only letters, digits and hyphens — the character set a RowRef segment can encode', ).brand<'MatchedSetIngredient'>(),
  matchedRef: rowRefContract,
}).brand<'MatchedSet'>();

export type MatchedSetData = z.infer<typeof matchedSetContract>;

/** What you may then call: `set`, `setRaw`, `saveRecordAs`, `remove`, and that ingredient's
 * extras — and nothing else. Dropping this restriction so a filtered set gains `add` is one of the
 * mutation tests the prototype's harness was checked against. */
export type Matched<I> = RowVerbs<I> & ExtraMethods<I>;
