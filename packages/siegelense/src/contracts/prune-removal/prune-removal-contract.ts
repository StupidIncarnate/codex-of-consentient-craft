/**
 * PURPOSE: One instance whose assets `prune` actually took, and what it got back. `freedBytes` sits
 * beside the spec's `freedMB` because `Megabytes` is `.int()`: a real reclaim of a few kilobytes
 * renders as `0`, and a reported zero over a real deletion is the one number this call must never
 * get wrong. `tombstoned` records whether the registry row was flipped to `pruned` — true only when
 * the WHOLE tree went, false when a `--kind` selector took one class and left the rest, because a
 * row marked `pruned` while its transcripts are still on disk would make `results` answer `pruned`
 * for evidence a fixer can still open. Reach for this over `ReapedInstance`: that one records an
 * instance whose PROCESSES were signalled, while nothing here touches an instance at all.
 *
 * USAGE:
 * pruneRemovalContract.parse({
 *   id: 'inst_9b2c', kind: null, freedBytes: 4_299_161_600, freedMB: 4100, tombstoned: true,
 * });
 * // Returns a validated PruneRemoval
 */

import { z } from 'zod';

import { fileSizeBytesContract } from '../file-size-bytes/file-size-bytes-contract';
import { instanceIdContract } from '../instance-id/instance-id-contract';
import { megabytesContract } from '../megabytes/megabytes-contract';
import { pruneAssetKindContract } from '../prune-asset-kind/prune-asset-kind-contract';

export const pruneRemovalContract = z.object({
  id: instanceIdContract,
  kind: pruneAssetKindContract.nullable(),
  freedBytes: fileSizeBytesContract,
  freedMB: megabytesContract,
  tombstoned: z.boolean(),
});

export type PruneRemoval = z.infer<typeof pruneRemovalContract>;
