/**
 * PURPOSE: One line of the KEY — one addressable element, with the four columns
 * (siegelense-tooling.md lines 386-393) plus the ref and the depth that make the listing a tree.
 * Reach for this over `StepCandidate`: a candidate is one row of an AMBIGUOUS error, shaped to
 * recover from a failed target, while a KeyRow is one row of the page's own listing and is the thing
 * a session reads BEFORE it targets anything.
 *
 * Three fields exist because the alternative was measured and was wrong:
 *
 * - `tag` is never null, even when `testId` is set. `PIXEL_BTN` does not say whether it is a
 *   `<button>` a keyboard can reach or a `<div>` with a click handler that a keyboard cannot, and
 *   that difference is a defect class of its own (line 395).
 * - `value` and `placeholder` are separate, because for an input they are different questions
 *   (line 391): the current value is what the field HOLDS and the placeholder is what it is CALLED.
 * - `text` is OWN text nodes only. A recursive read once pulled an entire Mantine stylesheet into
 *   one reading, and that single measurement is why the old `dom` verb was called unusable
 *   (line 570).
 *
 * `flags` carries one word each and `flagDetail` carries the measurement behind the few that have
 * one — `low-contrast` with `1.4`, `covered` with the ref painting on top — so the column stays one
 * word wide whatever a flag needs to say.
 *
 * USAGE:
 * keyRowContract.parse({
 *   ref: 26, depth: 2, testId: 'subagent-chain-duration', tag: 'span', role: null, domId: null,
 *   sibling: null, text: '4m', value: null, placeholder: null, attrs: [], attrsDropped: 0,
 *   flags: ['clipped-x'], flagDetail: {},
 * });
 * // Returns a validated KeyRow
 */

import { z } from '#gateway/npm/zod';


import { attrPairContract } from '../attr-pair/attr-pair-contract';
import { elementFlagContract } from '../element-flag/element-flag-contract';

export const keyRowContract = z.object({
  ref: z.number().int().positive().brand<'KeyRowRef'>(),
  depth: z.number().int().nonnegative().brand<'KeyRowDepth'>(),
  testId: z.string().brand<'KeyRowTestId'>().nullable(),
  tag: z.string().brand<'KeyRowTag'>(),
  role: z.string().brand<'KeyRowRole'>().nullable(),
  domId: z.string().brand<'KeyRowDomId'>().nullable(),
  sibling: z.string().brand<'KeyRowSibling'>().nullable(),
  text: z.string().brand<'KeyRowText'>().nullable(),
  value: z.string().brand<'KeyRowValue'>().nullable(),
  placeholder: z.string().brand<'KeyRowPlaceholder'>().nullable(),
  attrs: z.array(attrPairContract).readonly(),
  attrsDropped: z.number().int().nonnegative().brand<'KeyRowAttrsDropped'>(),
  flags: z.array(elementFlagContract).readonly(),
  flagDetail: z.record(z.string().brand<'KeyRowFlagDetailKey'>(), z.string().brand<'KeyRowFlagDetail'>()).readonly(),
}).brand<'KeyRow'>();

export type KeyRow = z.infer<typeof keyRowContract>;
