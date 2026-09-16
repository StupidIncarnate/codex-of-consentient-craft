/**
 * PURPOSE: Names the production code a `write` route imitates, so a diagnosis starts at the
 * counterpart instead of a hunt. Reach for this wherever an ingredient declares a `write` route
 * — Table 1 requires it there and nowhere else.
 *
 * USAGE:
 * copiesTargetContract.parse('questPersistBroker');
 * // Returns a branded CopiesTarget
 */
import { z } from 'zod';

export const copiesTargetContract = z.string().min(1).brand<'CopiesTarget'>();

export type CopiesTarget = z.infer<typeof copiesTargetContract>;
