/**
 * PURPOSE: Counts returned by ReconcileWatchersLayerResponder — how many JSONL watchers
 * it started and stopped during a single reconcile pass.
 *
 * USAGE:
 * reconcileWatchersResultContract.parse({ started: 1, stopped: 0 });
 */

import { z } from 'zod';

export const reconcileWatchersResultContract = z.object({
  started: z.number().int().nonnegative().brand<'StartedWatcherCount'>(),
  stopped: z.number().int().nonnegative().brand<'StoppedWatcherCount'>(),
});

export type ReconcileWatchersResult = z.infer<typeof reconcileWatchersResultContract>;
