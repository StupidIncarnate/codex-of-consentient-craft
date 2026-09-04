/**
 * PURPOSE: A whole session transcript, folded down to one answer: what it cost, and what it spent
 * that cost on. Every other contract in this package describes one line, one turn, or one gap.
 * This is the shape a post-mortem reads instead. A session transcript can run to hundreds of
 * megabytes of JSONL. A post-mortem should not have to re-walk it every time the same question
 * comes up.
 *
 * USAGE:
 * transcriptSummaryContract.parse({
 *   recordCount: 412, apiResponseCount: 96,
 *   startedAt: '2026-08-01T10:00:00.000Z', endedAt: '2026-08-01T11:30:00.000Z',
 *   wallClockSeconds: 5400, models: { 'claude-opus-5': 60, 'claude-sonnet-5': 36 },
 *   recordTypeCounts: { assistant: 96, user: 96 }, toolCallCounts: { Read: 40, Edit: 12 },
 *   toolResultBytes: 204_800, subagentCount: 3,
 *   usage: { inputTokens: 2, outputTokens: 239, cacheReadTokens: 0, cacheCreationTokens: 32_335, thinkingTokens: 0 },
 * });
 */
import { z } from 'zod';

import { tokenUsageContract } from '../token-usage/token-usage-contract';
import { isoTimestampContract } from '../iso-timestamp/iso-timestamp-contract';

export const transcriptSummaryContract = z
  .object({
    recordCount: z.number().int().nonnegative(),
    apiResponseCount: z.number().int().nonnegative(),
    startedAt: isoTimestampContract.optional(),
    endedAt: isoTimestampContract.optional(),
    wallClockSeconds: z.number().nonnegative().optional(),
    models: z.record(z.string(), z.number().int().nonnegative()),
    recordTypeCounts: z.record(z.string(), z.number().int().nonnegative()),
    toolCallCounts: z.record(z.string(), z.number().int().nonnegative()),
    toolResultBytes: z.number().int().nonnegative(),
    subagentCount: z.number().int().nonnegative(),
    usage: tokenUsageContract,
  })
  .brand<'TranscriptSummary'>();

export type TranscriptSummary = z.infer<typeof transcriptSummaryContract>;
