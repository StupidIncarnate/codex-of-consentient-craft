/**
 * PURPOSE: Generic persisted work item in quest.json. No role-specific data.
 *
 * USAGE:
 * workItemContract.parse({id: 'f47ac10b-...', role: 'codeweaver', status: 'pending', ...});
 * // Returns: WorkItem object
 */

import { z } from 'zod';

import { agentIdContract } from '../agent-id/agent-id-contract';
import { fileNameContract } from '../file-name/file-name-contract';
import { packageNameContract } from '../package-name/package-name-contract';
import { questWorkItemIdContract } from '../quest-work-item-id/quest-work-item-id-contract';
import { relatedDataItemContract } from '../related-data-item/related-data-item-contract';
import { sessionIdContract } from '../session-id/session-id-contract';
import { spawnerTypeContract } from '../spawner-type/spawner-type-contract';
import { streamSignalKindContract } from '../stream-signal-kind/stream-signal-kind-contract';
import { workItemRoleContract } from '../work-item-role/work-item-role-contract';
import { workItemStatusContract } from '../work-item-status/work-item-status-contract';

export const workItemContract = z.object({
  id: questWorkItemIdContract,
  role: workItemRoleContract,
  status: workItemStatusContract,
  spawnerType: spawnerTypeContract,
  sessionId: sessionIdContract.optional(),
  // Set when the work item is a Task-dispatched sub-agent under /dumpster-launch — value is
  // Claude CLI's realAgentId (the filename in `<sessionId>/subagents/agent-<agentId>.jsonl`).
  // Combined with `sessionId` (parent /dumpster-launch session) it locates the exact JSONL
  // file the replay should read. Absent for chat roles (chaoswhisperer, glyphsmith) whose
  // `sessionId` already points at a top-level `<sessionId>.jsonl`.
  agentId: agentIdContract.optional(),
  // INVARIANT (behavioral, enforced by every seeding path — quest-create, the relay graph
  // builder, and questAdvanceBroker): every work item carries exactly ONE `operations/<id>`
  // ref linking it to its operation item on the quest operations ledger, and each operation
  // item is worked by exactly ONE work item over its life (strict 1:1 — never re-linked,
  // never status-reverted). Ward items may additionally carry a `wardResults/<id>` ref.
  relatedDataItems: z.array(relatedDataItemContract).default([]),
  dependsOn: z.array(questWorkItemIdContract).default([]),
  attempt: z.number().int().nonnegative().brand<'Attempt'>().default(0),
  maxAttempts: z.number().int().positive().brand<'MaxAttempts'>().default(1),
  retryCount: z.number().int().nonnegative().brand<'FailCount'>().default(0),
  lastWardRunId: fileNameContract.optional(),
  createdAt: z.string().datetime().brand<'IsoTimestamp'>(),
  startedAt: z.string().datetime().brand<'IsoTimestamp'>().optional(),
  startRef: z
    .string()
    .min(1)
    .brand<'GitBaseRef'>()
    .optional()
    .describe(
      "The quest worktree's HEAD sha at the moment this work item was FIRST served its prompt. `<startRef>..HEAD` is the range the signal-back review-coverage gate rebuilds its blight checklist over, and it is the only range that measures what THIS item produced: every minion commits its own work as it goes, so at signal time the tree is clean (a working-tree reading is empty by construction), HEAD~1 sees one piece, and a plan-scoped reading sees one round. Written ONCE and never rewritten — a resumed or re-served session keeps its ORIGINAL start, because re-stamping after a crash would shrink the reviewed range to whatever landed afterwards. Deliberately `.optional()` with NO default, so a work item that never resolved a worktree, a hydrated quest, and every item seeded before this field simply carry none — and the gate skips them rather than refusing something they could never satisfy.",
    ),
  completedAt: z.string().datetime().brand<'IsoTimestamp'>().optional(),
  errorMessage: z.string().brand<'ErrorMessage'>().optional(),
  summary: z.string().brand<'SignalSummary'>().optional(),
  insertedBy: questWorkItemIdContract.optional(),
  resume: z
    .boolean()
    .optional()
    .describe(
      'Set by orphan recovery when it flips a crashed in_progress item back to pending while KEEPING sessionId: dispatch must resume that Claude session (claude --resume) instead of fresh-spawning, so work in the orphaned session is preserved',
    ),
  wardMode: z.enum(['changed', 'full']).optional(),
  packageNames: z
    .array(packageNameContract)
    .optional()
    .describe(
      'Copied from the linked operation item when advance creates this item, so the dispatched session is handed its package slice with the rest of its identity rather than having to resolve the operations ref to find it. Optional and omitted when empty, exactly as `wardMode` is: work items are the most numerous array on a quest, and a `.default([])` would materialise an empty array onto every one of them on every re-parse. The operation item is the authority — this is a copy taken at dispatch.',
    ),
  smoketestPromptOverride: z.string().min(1).brand<'PromptText'>().optional(),
  smoketestExpectedSignal: streamSignalKindContract.optional(),
  actualSignal: streamSignalKindContract.optional(),
});

export type WorkItem = z.infer<typeof workItemContract>;
