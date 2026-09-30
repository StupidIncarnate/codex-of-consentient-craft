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

import { z } from '#gateway/npm/zod';

const taskNotificationDurationMsContract = z
  .number()
  .int()
  .nonnegative()
  .brand<'TaskNotificationDurationMs'>();

const completionDurationMsContract = z.number().int().nonnegative().brand<'CompletionDurationMs'>();

export const subagentElapsedInputContract = z
  .object({
    startedAt: z.iso.datetime().brand<'SubagentElapsedInputStartedAt'>(),
    endedAt: z.iso.datetime().brand<'SubagentElapsedInputEndedAt'>().optional(),
    reportedDurationMs: taskNotificationDurationMsContract.optional(),
    // What the Task's own completion tool_result reported. Its own brand rather than
    // `reportedDurationMs`' — the two come from different wire shapes and rank differently, so a
    // value that slid between them would change which figure wins with nothing to catch it.
    completionDurationMs: completionDurationMsContract.optional(),
    clockReading: z.iso.datetime().brand<'SubagentElapsedInputClockReading'>().optional(),
  })
  .brand<'SubagentElapsedInput'>();

export type SubagentElapsedInput = z.infer<typeof subagentElapsedInputContract>;
