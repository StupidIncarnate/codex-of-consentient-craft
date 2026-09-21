/**
 * PURPOSE: The one field the router reads off a `kill {}` answer — whether the instance stopped. A
 * deliberate restatement of `stopped` on siegelense's own `killResultContract`: the orchestrator
 * cannot import that contract (depending on `@dungeonmaster/siegelense` is a cycle), and the router
 * has no use for `portsReleased`, `homeRemoved`, `evidenceKept` or `reapedPgids` — it records that
 * a lane closed, nothing more.
 *
 * USAGE:
 * laneKillResultContract.parse({ stopped: true });
 * // Returns a validated LaneKillResult
 */

import { z } from 'zod';

export const laneKillResultContract = z.object({
  stopped: z.boolean(),
});

export type LaneKillResult = z.infer<typeof laneKillResultContract>;
