/**
 * PURPOSE: ONE evidence file `prune` is deciding about — where it is, what class it belongs to, how
 * big it is and when it was last written. `sizeBytes` is read BEFORE the delete and is what
 * `freedBytes` is summed from: a size read afterwards is always zero, and a size guessed from the
 * directory is what turns a reported reclaim into fiction. `modifiedAtMs` rather than a creation
 * time, because `fs.Stats` has no portable birth time and the last WRITE is what "this evidence has
 * not been touched in seven days" actually means. Reach for this over `FileStat`: that one is the
 * two fields `fsStatAdapter` answers with, while this pairs them with the path and the class the
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

import { z } from 'zod';

import { absoluteFilePathContract } from '@dungeonmaster/shared/contracts';

import { epochMsContract } from '../epoch-ms/epoch-ms-contract';
import { fileSizeBytesContract } from '../file-size-bytes/file-size-bytes-contract';
import { pruneAssetKindContract } from '../prune-asset-kind/prune-asset-kind-contract';

export const pruneAssetContract = z.object({
  path: absoluteFilePathContract,
  kind: pruneAssetKindContract,
  sizeBytes: fileSizeBytesContract,
  modifiedAtMs: epochMsContract,
});

export type PruneAsset = z.infer<typeof pruneAssetContract>;
