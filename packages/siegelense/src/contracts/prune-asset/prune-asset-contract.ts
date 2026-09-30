/**
 * PURPOSE: ONE evidence file `prune` is deciding about — where it is, what class it belongs to, how
 * big it is and when it was last written. `sizeBytes` is read BEFORE the delete and is what
 * `freedBytes` is summed from: a size read afterwards is always zero, and a size guessed from the
 * directory is what turns a reported reclaim into fiction. `modifiedAtMs` rather than a creation
 * time, because `fs.Stats` has no portable birth time and the last WRITE is what "this evidence has
 * not been touched in seven days" actually means. Reach for this over `FileStat`: that one is the
 * two fields a stat read keeps, while this pairs them with the path and the class the
 * selector filters on.
 *
 * USAGE:
 * pruneAssetContract.parse({
 *   path: '/home/u/.dungeonmaster/siegelense/unowned/instances/inst_9b2c/runs/run_1/step1.png',
 *   kind: 'shot',
 *   sizeBytes: 2048,
 *   modifiedAtMs: 1700000000000,
 * });
 * // Returns a validated PruneAsset
 */

import { z } from '#gateway/npm/zod';


import { pruneAssetKindContract } from '../prune-asset-kind/prune-asset-kind-contract';

export const pruneAssetContract = z.object({
  path: z.string().min(1).refine((path) => { if (path.startsWith('/')) { return true; } if (/^[A-Za-z]:\\/u.test(path)) { return true; } return false; }, { message: 'Path must be absolute (start with / or C:\\ on Windows)', },).brand<'PruneAssetPath'>(),
  kind: pruneAssetKindContract,
  sizeBytes: z.number().int().nonnegative().brand<'PruneAssetSizeBytes'>(),
  modifiedAtMs: z.number().int().nonnegative().brand<'PruneAssetModifiedAtMs'>(),
}).brand<'PruneAsset'>();

export type PruneAsset = z.infer<typeof pruneAssetContract>;
