/**
 * PURPOSE: Discriminated union describing a single assertion evaluated against final quest state at the end of an orchestration smoketest case
 *
 * USAGE:
 * smoketestAssertionContract.parse({ kind: 'quest-status', expected: 'complete' });
 * // Returns: SmoketestAssertion (variant: quest-status)
 */

import { z } from '#gateway/npm/zod';

import {
  questStatusContract,
  workItemRoleContract,
  workItemStatusContract,
} from '@dungeonmaster/shared/contracts';

const questStatusAssertionContract = z
  .object({
    kind: z.literal('quest-status'),
    expected: questStatusContract,
  })
  .brand<'QuestStatusAssertion'>();

const workItemStatusHistogramAssertionContract = z
  .object({
    kind: z.literal('work-item-status-histogram'),
    // `z.partialRecord`, not `z.record` — zod v4 made an enum-keyed `z.record` exhaustive (every
    // status required), and a real histogram asserts only the statuses it cares about.
    expected: z.partialRecord(
      workItemStatusContract,
      z.number().int().nonnegative().brand<'WorkItemStatusHistogramAssertionExpected'>(),
    ),
  })
  .brand<'WorkItemStatusHistogramAssertion'>();

const workItemRoleCountAssertionContract = z
  .object({
    kind: z.literal('work-item-role-count'),
    role: workItemRoleContract,
    minCount: z.number().int().nonnegative().brand<'WorkItemRoleCountAssertionMinCount'>(),
  })
  .brand<'WorkItemRoleCountAssertion'>();

const workItemSignalMatchAssertionContract = z
  .object({
    kind: z.literal('work-item-signal-match'),
  })
  .brand<'WorkItemSignalMatchAssertion'>();

export const smoketestAssertionContract = z.discriminatedUnion('kind', [
  questStatusAssertionContract,
  workItemStatusHistogramAssertionContract,
  workItemRoleCountAssertionContract,
  workItemSignalMatchAssertionContract,
]);

export type SmoketestAssertion = z.infer<typeof smoketestAssertionContract>;
