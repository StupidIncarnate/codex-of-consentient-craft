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
import { rowRefStatics } from '../../statics/row-ref/row-ref-statics';
import type { RowVerbs, ExtraMethods } from '../ingredient-handle/ingredient-handle-contract';

const { separator, matchWord } = rowRefStatics.slot;
const ROW_REF_SLOT = `(?:\\d+${separator}\\d+|${matchWord})`;
const ROW_REF_SEGMENT = `[A-Za-z][A-Za-z0-9-]*\\[${ROW_REF_SLOT}\\]`;
const ROW_REF_PATTERN = new RegExp(`^${ROW_REF_SEGMENT}(?:\\/${ROW_REF_SEGMENT})*$`, 'u');
const ROW_REF_MESSAGE = "must be an ancestor path like 'guild[0:0]/quest[0:2]'";

export const matchedSetContract = z
  .object({
    ingredient: z
      .string()
      .min(1)
      .regex(
        /^[A-Za-z][A-Za-z0-9-]*$/u,
        'must start with a letter and hold only letters, digits and hyphens — the character set a RowRef segment can encode',
      )
      .brand<'MatchedSetIngredient'>(),
    matchedRef: z
      .string()
      .min(1)
      .regex(ROW_REF_PATTERN, ROW_REF_MESSAGE)
      .brand<'MatchedSetMatchedRef'>(),
  })
  .brand<'MatchedSet'>();

export type MatchedSetData = z.infer<typeof matchedSetContract>;

/** What you may then call: `set`, `setRaw`, `saveRecordAs`, `remove`, and that ingredient's
 * extras — and nothing else. Dropping this restriction so a filtered set gains `add` is one of the
 * mutation tests the prototype's harness was checked against. */
export type Matched<I> = RowVerbs<I> & ExtraMethods<I>;
