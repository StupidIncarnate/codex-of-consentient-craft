/**
 * PURPOSE: Lightweight riftcarver result ref stored in quest.json — the streamed carve log lives in
 * the quest folder under `riftcarver-results/{id}.log`. Reach for this over wardResultContract when
 * the record is a workspace carve rather than a quality gate: `outcome` is what the failure routing
 * reads, since a carve fails in two incompatible ways — a repairable build/node_modules red that
 * earns a spiritmender pass, and a git-state or permission red that blocks the quest outright rather
 * than dispatching any agent into the repo-root checkout.
 *
 * `failedStep` carries a `worktreePrepareStepStatics` step name. It is a branded string rather than
 * an enum of those members because that static lives in @dungeonmaster/orchestrator, which depends
 * on this package — enumerating it here would invert the dependency.
 *
 * USAGE:
 * riftcarverResultContract.parse({id: 'f47ac10b-...', createdAt: '2024-01-15T10:00:00.000Z', exitCode: 0, outcome: 'green'});
 * // Returns: RiftcarverResult (lightweight ref, log at {questFolder}/riftcarver-results/{id}.log)
 */

import { z } from 'zod';

export const riftcarverResultContract = z.object({
  id: z.string().uuid().brand<'RiftcarverResultId'>(),
  createdAt: z.string().datetime().brand<'IsoTimestamp'>(),
  exitCode: z.number().int().brand<'ExitCode'>(),
  failedStep: z.string().min(1).brand<'WorktreePrepareStep'>().optional(),
  outcome: z.enum(['green', 'repairable', 'blocked']),
});

export type RiftcarverResult = z.infer<typeof riftcarverResultContract>;
