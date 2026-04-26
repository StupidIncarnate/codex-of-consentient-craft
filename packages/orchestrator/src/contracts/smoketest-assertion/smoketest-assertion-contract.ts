/**
 * PURPOSE: Discriminated union describing a single assertion evaluated against final quest state at the end of an orchestration smoketest case
 *
 * USAGE:
 * smoketestAssertionContract.parse({ kind: 'quest-status', expected: 'complete' });
 * // Returns: SmoketestAssertion (variant: quest-status)
 */

import { z } from 'zod';

import {
  questStatusContract,
  workItemRoleContract,
  workItemStatusContract,
} from '@dungeonmaster/shared/contracts';

const questStatusAssertionContract = z.object({
  kind: z.literal('quest-status'),
  expected: questStatusContract,
});

const workItemStatusHistogramAssertionContract = z.object({
  kind: z.literal('work-item-status-histogram'),
  expected: z.record(
    workItemStatusContract,
    z.number().int().nonnegative().brand<'WorkItemStatusCount'>(),
  ),
});

const workItemRoleCountAssertionContract = z.object({
  kind: z.literal('work-item-role-count'),
  role: workItemRoleContract,
  minCount: z.number().int().nonnegative().brand<'WorkItemRoleMinCount'>(),
});

const workItemSignalMatchAssertionContract = z.object({
  kind: z.literal('work-item-signal-match'),
});

export const smoketestAssertionContract = z.discriminatedUnion('kind', [
  questStatusAssertionContract,
  workItemStatusHistogramAssertionContract,
  workItemRoleCountAssertionContract,
  workItemSignalMatchAssertionContract,
]);

export type SmoketestAssertion = z.infer<typeof smoketestAssertionContract>;
