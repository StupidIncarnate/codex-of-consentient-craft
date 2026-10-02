/**
 * PURPOSE: Which class of evidence file a `prune --kind` selector names — `video`, `shot`, `log`
 * or `run`. `video` is the reason the field exists at all: a screencast dwarfs every shot and run
 * combined, so it ages out first and separately (siegelense-tooling.md line 248), and a caller
 * reclaiming space reaches for it before anything else. Reach for this over `ResultKind`: that one
 * names a QUERY a fixer runs against evidence, while this names a FILE CLASS on disk —
 * `console`/`network`/`ws`/`server` are four `ResultKind`s that all live in files this contract
 * calls `run` or `log`.
 *
 * USAGE:
 * pruneAssetKindContract.parse('video');
 * // Returns 'video' as PruneAssetKind
 */

import { z } from '#gateway/npm/zod';

export const pruneAssetKindContract = z.enum(['video', 'shot', 'log', 'run']);

export type PruneAssetKind = z.infer<typeof pruneAssetKindContract>;
