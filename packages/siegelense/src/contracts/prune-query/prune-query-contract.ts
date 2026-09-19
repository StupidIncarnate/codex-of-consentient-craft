/**
 * PURPOSE: The three selectors `prune` takes, and they COMBINE — `kind: 'video'` plus
 * `olderThan: '2d'` is the spec's own worked call (siegelense-tooling.md line 2425). `instanceId`
 * and `kind` are `.nullable()` rather than `.optional()` because the argv parser always decides a
 * value for them, so no reader of this shape is ever left asking whether a field was left unset.
 * `olderThan` has no null: a prune with no window is a prune of everything, and the one call in
 * this tool that deletes files may not have "take it all" as its default — so the parser supplies
 * `pruneStatics.window.defaultOlderThan` when nothing was typed. Reach for this over `PruneArgs`:
 * that one adds the rendering flag the CLI surface carries, which no broker should ever see.
 *
 * USAGE:
 * pruneQueryContract.parse({ instanceId: null, kind: 'video', olderThan: '2d' });
 * // Returns a validated PruneQuery
 */

import { z } from 'zod';

import { elapsedTextContract } from '../elapsed-text/elapsed-text-contract';
import { instanceIdContract } from '../instance-id/instance-id-contract';
import { pruneAssetKindContract } from '../prune-asset-kind/prune-asset-kind-contract';

export const pruneQueryContract = z
  .object({
    instanceId: instanceIdContract.nullable(),
    kind: pruneAssetKindContract.nullable(),
    olderThan: elapsedTextContract,
  })
  .strict();

export type PruneQuery = z.infer<typeof pruneQueryContract>;
