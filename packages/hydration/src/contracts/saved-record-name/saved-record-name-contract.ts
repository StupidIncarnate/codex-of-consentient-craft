/**
 * PURPOSE: Names one ROW inside a recipe, for `saveRecordAs` and `fromSaved`. Reach for this
 * over a batch step's own `as:` — that names a STEP's output, and the two are different levels.
 *
 * USAGE:
 * savedRecordNameContract.parse('origin');
 * // Returns a branded SavedRecordName
 */
import { z } from 'zod';

export const savedRecordNameContract = z.string().min(1).brand<'SavedRecordName'>();

export type SavedRecordName = z.infer<typeof savedRecordNameContract>;
