/**
 * PURPOSE: One instance whose assets `prune` REFUSED to take, and why in a sentence the caller can
 * act on — `{ id: 'inst_1d09', why: 'run_7 cited by a VERIFIED prelude in
 * .quest-plans/1dac5395…/path-3.md' }` (siegelense-tooling.md lines 2427-2428). The `why` is the
 * whole point of the shape: it refuses rather than warns, and a refusal that does not name the
 * citing file is a claim rather than a check (line 2436). Reach for this over `LeftAlone`: that one
 * is `cleanup`'s record of an INSTANCE it did not reap, while this is a record of EVIDENCE that
 * stayed — the same shape answering a different question, and collapsing them would let a live-row
 * reason and a citation reason be read as the same kind of fact.
 *
 * USAGE:
 * pruneRefusalContract.parse({
 *   id: 'inst_1d09',
 *   why: 'run_7 cited by a VERIFIED prelude in /repo/.quest-plans/1dac5395/path-3.md',
 * });
 * // Returns a validated PruneRefusal
 */

import { z } from 'zod';

import { contentTextContract } from '@dungeonmaster/shared/contracts';

import { instanceIdContract } from '../instance-id/instance-id-contract';

export const pruneRefusalContract = z.object({
  id: instanceIdContract,
  why: contentTextContract,
});

export type PruneRefusal = z.infer<typeof pruneRefusalContract>;
