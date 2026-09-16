/**
 * PURPOSE: One entry of `instanceStatusContract`'s `orphans` list — a pgid a dead instance's
 * heartbeat recorded, and whether it is still alive (spec line 1179, 1195: "carries pgids and
 * whether each is still alive, because that is what a session needs to decide whether to reap").
 * `cmd` is `.nullable()` because the common case is a reap: once `/proc/<pgid>` is gone there is no
 * command line left to read, and that absence is itself the ordinary outcome, not a fetch failure.
 * Reach for this over a bare `ProcessGroupId` wherever the caller also needs to know liveness before
 * deciding to `kill`.
 *
 * USAGE:
 * orphanReadingContract.parse({ pgid: 33812, cmd: 'npm run dev:no-watch', alive: true });
 * // Returns a validated OrphanReading
 */

import { z } from 'zod';

import { contentTextContract } from '@dungeonmaster/shared/contracts';

import { processGroupIdContract } from '../process-group-id/process-group-id-contract';

export const orphanReadingContract = z.object({
  pgid: processGroupIdContract,
  cmd: contentTextContract.nullable(),
  alive: z.boolean(),
});

export type OrphanReading = z.infer<typeof orphanReadingContract>;
