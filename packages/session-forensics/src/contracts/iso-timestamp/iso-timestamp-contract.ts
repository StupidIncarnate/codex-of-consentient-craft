/**
 * PURPOSE: The one definition of a moment in this package. Every timestamp here arrives as text from
 * a Claude Code JSONL record or a quest file rather than as a `Date`, and each of the four shapes that
 * carry one would otherwise re-declare its own validation — which is how two of them end up disagreeing
 * about whether a missing zone is acceptable. `@dungeonmaster/shared` has no equivalent to reach for.
 *
 * USAGE:
 * isoTimestampContract.parse('2026-09-01T19:09:06.542Z');
 */
import { z } from 'zod';

export const isoTimestampContract = z.string().datetime().brand<'IsoTimestamp'>();

export type IsoTimestamp = z.infer<typeof isoTimestampContract>;
