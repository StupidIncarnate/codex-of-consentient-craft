/**
 * PURPOSE: One projected field name inside a `results` query's `fields: [...]` array — a caller's
 * own narrowing of a row's shape, validated only as non-empty because the rows `results` returns
 * are as varied as the six kinds it reads and never fit one closed vocabulary. Reach for this over
 * ContentText (`@dungeonmaster/shared/contracts`) whenever the value names a FIELD a caller wants
 * projected, not the row content itself.
 *
 * USAGE:
 * resultFieldContract.parse('status');
 * // Returns a branded ResultField
 */

import { z } from 'zod';

export const resultFieldContract = z.string().min(1).brand<'ResultField'>();

export type ResultField = z.infer<typeof resultFieldContract>;
