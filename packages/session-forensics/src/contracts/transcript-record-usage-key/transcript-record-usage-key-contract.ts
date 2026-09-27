/**
 * PURPOSE: A key into `transcriptRecordContract`'s `message.usage` record. Claude Code adds new
 * snake_case usage keys over time, so this brands only the key rather than a closed field list — a
 * caller reading a known key (e.g. `'input_tokens'`) re-parses it through this contract to index
 * the branded `Record` that field returns.
 *
 * USAGE:
 * transcriptRecordUsageKeyContract.parse('input_tokens');
 * // Returns a branded TranscriptRecordUsageKey
 */
import { z } from 'zod';

export const transcriptRecordUsageKeyContract = z.string().brand<'TranscriptRecordUsageKey'>();

export type TranscriptRecordUsageKey = z.infer<typeof transcriptRecordUsageKeyContract>;
