/**
 * PURPOSE: Every raw timestamp and duration a sub-agent chain's figure could be computed from,
 * gathered from wherever each one lives — the Task tool-use entry, the completion notification,
 * the completion tool_result, the panel's live clock — before `subagentDurationLabelTransformer`
 * picks between them. Keeping this as its own contract is what lets that transformer stay a pure
 * function of one shape instead of reaching into `ChatEntryGroup` itself.
 *
 * USAGE:
 * subagentElapsedInputContract.parse({startedAt: '2026-09-10T10:00:00.000Z'});
 * // Returns a branded SubagentElapsedInput with every optional field omitted
 */

import { z } from 'zod';

import { isoTimestampContract } from '../iso-timestamp/iso-timestamp-contract';

const taskNotificationDurationMsContract = z
  .number()
  .int()
  .nonnegative()
  .brand<'TaskNotificationDurationMs'>();

const completionDurationMsContract = z.number().int().nonnegative().brand<'CompletionDurationMs'>();

export const subagentElapsedInputContract = z.object({
  startedAt: isoTimestampContract,
  endedAt: isoTimestampContract.optional(),
  reportedDurationMs: taskNotificationDurationMsContract.optional(),
  // What the Task's own completion tool_result reported. Its own brand rather than
  // `reportedDurationMs`' — the two come from different wire shapes and rank differently, so a
  // value that slid between them would change which figure wins with nothing to catch it.
  completionDurationMs: completionDurationMsContract.optional(),
  clockReading: isoTimestampContract.optional(),
});

export type SubagentElapsedInput = z.infer<typeof subagentElapsedInputContract>;
