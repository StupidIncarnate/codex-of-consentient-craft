/**
 * PURPOSE: One CONDITION a key row is in — the flags column. Derived from `keyStatics.flags.all`
 * rather than retyped here, so the vocabulary lives in the one file carrying the rule that stops it
 * growing. Reach for this over an `AttrPair`: the split is DECLARED versus CONDITION
 * (siegelense-tooling.md line 399). An attr is a value the markup states and you would quote — a
 * path, a status string, a number. A flag is a condition, boolean or computed, where the PRESENCE of
 * the word is the whole message; anything carrying a measurement puts it in the row's `flagDetail`
 * instead, so the column stays one word wide.
 *
 * USAGE:
 * elementFlagContract.parse('not-tabbable');
 * // Returns a branded ElementFlag
 */

import { z } from 'zod';

import { keyStatics } from '../../statics/key/key-statics';

export const elementFlagContract = z.enum(keyStatics.flags.all).brand<'ElementFlag'>();

export type ElementFlag = z.infer<typeof elementFlagContract>;
