/**
 * PURPOSE: One whole KEY — the listing a `look` returns: the rows in document order, the two
 * key-level readings that are not row flags, and the already-rendered text a session reads. Reach
 * for this over `KeyRow`: a KeyRow is one line, while a KeyListing is the reading, and the three
 * fields beside `rows` are the parts that only exist at the whole-page level.
 *
 * **There is NO `map` key, and that is a decision rather than an omission.** The numbered map ships
 * last or never (siegelense-tooling.md line 2588: "look omits the field until it ships, then returns
 * it only on `map: true`… An absent field is honest where an empty one invites a session to wonder
 * what went wrong"). The one trial arm that had a map rendered three and opened none. Adding a
 * nullable `map` here is the instinct to resist.
 *
 * - `duplicates` is the line a testId appearing under two DIFFERENT parents prints under the key
 *   (line 524). That line is the bug all three trial arms found, printed without anyone looking for
 *   it: an inner body rendered twice, once nested correctly and once orphaned, with no console
 *   warning. `[n/m]` handles siblings; this handles the case that is not siblings.
 * - `truncated` is what a `within` scope or a depth limit LEFT OUT, named (line 558). A key that
 *   quietly stops is the `count: 0` problem wearing a different hat.
 * - `rendered` is the text tree itself, because the key is the primary navigation surface rather
 *   than a companion to the picture, and a caller that had to render it would be a second renderer
 *   drifting from the first.
 *
 * USAGE:
 * keyListingContract.parse({ within: null, rows: [], duplicates: [], truncated: [], rendered: '…' });
 * // Returns a validated KeyListing
 */

import { z } from 'zod';

import { contentTextContract } from '@dungeonmaster/shared/contracts';

import { keyRowContract } from '../key-row/key-row-contract';
import { selectorContract } from '../selector/selector-contract';

export const keyListingContract = z
  .object({
    within: selectorContract.nullable(),
    rows: z.array(keyRowContract).readonly(),
    duplicates: z.array(contentTextContract).readonly(),
    truncated: z.array(contentTextContract).readonly(),
    rendered: contentTextContract,
  })
  .strict();

export type KeyListing = z.infer<typeof keyListingContract>;
