/**
 * PURPOSE: The whole `prune` answer — `freedMB`, `removed[]` and `refused[]` (siegelense-tooling.md
 * lines 2426-2428), plus two fields the spec's three-line example does not show and this call
 * cannot be honest without. `freedBytes` exists because `Megabytes` is `.int()`: a real reclaim of a
 * few kilobytes renders `freedMB: 0`, and a reported zero over a real deletion is the one number
 * this call must never get wrong. `unresolved[]` names every citation KIND the resolver could not
 * check — without it, `refused: []` reads as "nothing cites any of this" even for a question that
 * was never put, which is the quiet deletion the retention section exists to prevent (line 2431).
 * `.strict()`, for the same reason `cleanupAnswerContract` is: a field silently accepted is a field
 * nothing renders.
 *
 * USAGE:
 * pruneAnswerContract.parse({
 *   freedMB: 4100, freedBytes: 4_299_161_600,
 *   removed: [{ id: 'inst_9b2c', kind: null, freedBytes: 4_299_161_600, freedMB: 4100, tombstoned: true }],
 *   refused: [{ id: 'inst_1d09', why: 'run_7 cited by a VERIFIED prelude in …/path-3.md' }],
 *   unresolved: [{ kind: 'open-issue', why: 'no issue record exists on disk to check' }],
 * });
 * // Returns a validated PruneAnswer
 */

import { z } from 'zod';

import { citationGapContract } from '../citation-gap/citation-gap-contract';
import { fileSizeBytesContract } from '../file-size-bytes/file-size-bytes-contract';
import { megabytesContract } from '../megabytes/megabytes-contract';
import { pruneRefusalContract } from '../prune-refusal/prune-refusal-contract';
import { pruneRemovalContract } from '../prune-removal/prune-removal-contract';

export const pruneAnswerContract = z
  .object({
    freedMB: megabytesContract,
    freedBytes: fileSizeBytesContract,
    removed: z.array(pruneRemovalContract).readonly(),
    refused: z.array(pruneRefusalContract).readonly(),
    unresolved: z.array(citationGapContract).readonly(),
  })
  .strict();

export type PruneAnswer = z.infer<typeof pruneAnswerContract>;
