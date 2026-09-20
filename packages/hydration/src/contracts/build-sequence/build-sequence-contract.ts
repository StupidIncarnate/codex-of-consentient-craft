/**
 * PURPOSE: A process-wide marker of which BUILD is currently producing ops — advanced once per
 * recipe invocation, never once per `.add()` call. `collectionChainTransformer` compares its own
 * last-seen `BuildSequence` against the current one to tell "another `add()` inside THIS build"
 * (unchanged, keep counting) from "a fresh build" (changed, restart the count at zero) — see
 * `buildSequenceMarkTransformer`.
 *
 * USAGE:
 * buildSequenceContract.parse(0);
 * // Returns a branded BuildSequence
 */
import { z } from 'zod';

export const buildSequenceContract = z.number().int().nonnegative().brand<'BuildSequence'>();

export type BuildSequence = z.infer<typeof buildSequenceContract>;
