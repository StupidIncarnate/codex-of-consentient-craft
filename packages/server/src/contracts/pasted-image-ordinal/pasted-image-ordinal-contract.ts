/**
 * PURPOSE: The one-based position an accepted local image path (or bitmap placeholder) takes
 * within one message's numbering sequence, assigned in text order. The find-transformer that
 * discovers a path and the copy/rewrite steps that later act on it share this brand so a file
 * always resolves back to the exact ordinal that named it.
 *
 * USAGE:
 * pastedImageOrdinalContract.parse(1);
 * // Returns branded PastedImageOrdinal
 */

import { z } from 'zod';

export const pastedImageOrdinalContract = z.number().int().positive().brand<'PastedImageOrdinal'>();

export type PastedImageOrdinal = z.infer<typeof pastedImageOrdinalContract>;
