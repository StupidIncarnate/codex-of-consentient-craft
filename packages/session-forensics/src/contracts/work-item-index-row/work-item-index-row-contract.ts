/**
 * PURPOSE: One row of the per-work-item index `.claude/commands/quest-forensics.md` Step 1 used to
 * assemble by hand: role, status, session id, wall clock, the joined operation's text/flows/
 * packages, transcript size, sub-agent count, and any ward/riftcarver result the item points at.
 * The `quest` CLI command prints one of these per work item. Reach for this over reading
 * `workItem`/`operationItem` fields directly whenever the caller wants the JOINED, print-ready
 * shape rather than the raw quest.json rows.
 *
 * USAGE:
 * workItemIndexRowContract.parse({
 *   workItemId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479', role: 'codeweaver', status: 'complete',
 *   transcriptSizeBytes: 1024, subagentCount: 2,
 * });
 */
import { z } from 'zod';

import {
  workItemRoleContract,
  workItemStatusContract,
  sessionIdContract,
} from '@dungeonmaster/shared/contracts';

export const workItemIndexRowContract = z
  .object({
    workItemId: z.string(),
    role: workItemRoleContract,
    status: workItemStatusContract,
    sessionId: sessionIdContract.optional(),
    // Undefined when the item never completed — `completedAt - startedAt` (or `createdAt` when
    // `startedAt` is absent) needs both ends of the range to exist.
    wallClockSeconds: z.number().optional(),
    operationText: z.string().optional(),
    flowIds: z.array(z.string()).default([]),
    packageNames: z.array(z.string()).default([]),
    transcriptSizeBytes: z.number().int().nonnegative().default(0),
    subagentCount: z.number().int().nonnegative().default(0),
    wardRiftcarverSummary: z.string().optional(),
  })
  .brand<'WorkItemIndexRow'>();

export type WorkItemIndexRow = z.infer<typeof workItemIndexRowContract>;
