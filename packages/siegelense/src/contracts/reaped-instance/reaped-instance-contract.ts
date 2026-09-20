/**
 * PURPOSE: One instance `cleanup` reaped for staleness — the pgids it signalled and whether its
 * throwaway home came down with it (spec line 1357: `{ id: 'inst_9b2c', staleFor: '9h', killed:
 * [33812, 33840], homeRemoved: true }`). `killed` is the set `cleanup` actually SIGNALLED, which can
 * be empty when every recorded pgid was already gone by the time cleanup read `/proc` — a fact
 * distinct from `homeRemoved`, since a home directory can vanish with nothing left alive to signal.
 * Reach for this over `KillResult`: that one is a single live-driver teardown answering ONE `kill`
 * call, while this is one row of a STALENESS sweep that never talked to a driver at all.
 *
 * USAGE:
 * reapedInstanceContract.parse({
 *   id: 'inst_9b2c', staleFor: '9h', killed: [33812, 33840], homeRemoved: true,
 * });
 * // Returns a validated ReapedInstance
 */

import { z } from 'zod';

import { elapsedTextContract } from '../elapsed-text/elapsed-text-contract';
import { instanceIdContract } from '../instance-id/instance-id-contract';
import { processGroupIdContract } from '../process-group-id/process-group-id-contract';

export const reapedInstanceContract = z.object({
  id: instanceIdContract,
  staleFor: elapsedTextContract,
  killed: z.array(processGroupIdContract).readonly(),
  homeRemoved: z.boolean(),
});

export type ReapedInstance = z.infer<typeof reapedInstanceContract>;
