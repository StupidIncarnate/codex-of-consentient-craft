/**
 * PURPOSE: The one process-wide marker every top-level collection's call-index counter compares
 * itself against, so a fresh BUILD can be told apart from another `add()` inside the SAME build.
 * `{ advance: true }` is `recipeDeclareBroker`'s own hook, called once, right before a recipe's
 * `build` runs — every collection that collaborates on the plan then sees a marker that has moved
 * since its own last `add()`. `{ advance: false }` is `collectionChainTransformer`'s own peek: it
 * never mutates, so two sibling `add()` calls inside ONE build keep reading the SAME marker and
 * keep counting instead of resetting against each other. A TOP-LEVEL collection is built once, at
 * `registry()` time, and reused by every later call to whichever recipe closes over it — comparing
 * against this marker is what makes that reuse safe, in place of trusting a fresh JS closure per
 * build, which a singleton registry never gets.
 *
 * USAGE:
 * buildSequenceMarkTransformer({ advance: true });
 * // Returns the freshly-advanced BuildSequence, one higher than the previous call
 */
import { buildSequenceContract } from '../../contracts/build-sequence/build-sequence-contract';
import type { BuildSequence } from '../../contracts/build-sequence/build-sequence-contract';

let currentBuildSequence = buildSequenceContract.parse(0);

export const buildSequenceMarkTransformer = ({ advance }: { advance: boolean }): BuildSequence => {
  if (advance) {
    currentBuildSequence = buildSequenceContract.parse(currentBuildSequence + 1);
  }
  return currentBuildSequence;
};
