/**
 * PURPOSE: The one definition of a moment (a timestamp) in this package. Every timestamp here
 * arrives as text, not as a `Date`. The text comes from a Claude Code JSONL record or a quest
 * file. Without this contract, each of the four shapes that carry a timestamp would redeclare its
 * own validation. That is how two of them ended up disagreeing about whether a missing time zone
 * is acceptable. `@dungeonmaster/shared` has no equivalent contract to reuse.
 *
 * USAGE:
 * isoTimestampContract.parse('2026-09-01T19:09:06.542Z');
 */
import { z } from 'zod';

export const isoTimestampContract = z.string().datetime().brand<'IsoTimestamp'>();

export type IsoTimestamp = z.infer<typeof isoTimestampContract>;
