/**
 * PURPOSE: The four raw timestamps/durations a sub-agent chain's duration figure is computed
 * from, gathered from wherever each one lives (the Task tool-use entry, the completion
 * notification, the panel's live clock) before `subagentDurationLabelTransformer` turns them into
 * a display band. Keeping this as its own contract is what lets that transformer stay a pure
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

export const subagentElapsedInputContract = z.object({
  startedAt: isoTimestampContract,
  endedAt: isoTimestampContract.optional(),
  reportedDurationMs: taskNotificationDurationMsContract.optional(),
  clockReading: isoTimestampContract.optional(),
});

export type SubagentElapsedInput = z.infer<typeof subagentElapsedInputContract>;
