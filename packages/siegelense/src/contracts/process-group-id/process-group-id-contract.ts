/**
 * PURPOSE: A pgid is the target `process.kill` NEGATES to signal a whole tree, which is what a bare
 * `ProcessId` (`@dungeonmaster/shared/contracts`) cannot do: `npm run` is a wrapper, so the process
 * actually holding a port is a grandchild spawned via `sh -c`, and a signal aimed at the pid alone
 * never reaches it. `ProcessGroupId` is also the field a heartbeat file has to persist to disk —
 * after a SIGKILL nothing in memory holds it, so without that file the orphans it once named can
 * only be guessed at, never found.
 *
 * USAGE:
 * const pgid = processGroupIdContract.parse(4821);
 * // Returns branded ProcessGroupId
 */

import { z } from 'zod';

export const processGroupIdContract = z.number().int().positive().brand<'ProcessGroupId'>();

export type ProcessGroupId = z.infer<typeof processGroupIdContract>;
