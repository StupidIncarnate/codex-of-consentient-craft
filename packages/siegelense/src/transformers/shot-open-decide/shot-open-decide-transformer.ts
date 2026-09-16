/**
 * PURPOSE: Pure policy over one run's raw shot list — the five-way precedence `blank` -> `failed` ->
 * `start` -> `end` -> `changed` (siegelense-tooling.md line 1631: `blank` is checked BEFORE
 * `pixelChange` is interpreted at all). The precedence ORDER is read off
 * `shotOpenReasonContract.unwrap().options` (`.unwrap()` reaches the underlying `ZodEnum` the brand
 * wraps) rather than re-encoded here — the per-reason condition still has to live somewhere, but
 * WHICH one wins is decided by walking that array in order and taking the first match, so a future
 * re-ordering of the enum reorders precedence with no change to this file. `changed` compares the
 * measured `pixelChange` against `perceptionStatics.pixelChange.openThresholdPercent` (30, spec line
 * 704's "large, 30%+") — the one reason that can never fire on the first or last shot, since
 * `start`/`end` already claim those positions ahead of it in the order. Reach for this over deciding
 * the flag inline inside `runExecuteBroker`: keeping the policy pure is what lets it be proven with no
 * browser and no captured file at all.
 *
 * USAGE:
 * shotOpenDecideTransformer({
 *   shots: [ShotListingStub({ step: 1, open: false, why: null }), ShotListingStub({ step: 2, open: false, why: null })],
 *   failedStep: null,
 * });
 * // Returns the same two shots, the first flagged open/'start', the last flagged open/'end'
 */

import { perceptionStatics } from '../../statics/perception/perception-statics';
import { shotListingContract } from '../../contracts/shot-listing/shot-listing-contract';
import type { ShotListing } from '../../contracts/shot-listing/shot-listing-contract';
import { shotOpenReasonContract } from '../../contracts/shot-open-reason/shot-open-reason-contract';
import type { StepIndex } from '../../contracts/step-index/step-index-contract';

export const shotOpenDecideTransformer = ({
  shots,
  failedStep,
}: {
  shots: readonly ShotListing[];
  failedStep: StepIndex | null;
}): readonly ShotListing[] => {
  const lastPosition = shots.length - 1;

  return shots.map((shot, position) => {
    const reason =
      shotOpenReasonContract.unwrap().options.find((option) => {
        if (option === 'blank') {
          return shot.blank === true;
        }
        if (option === 'failed') {
          return failedStep !== null && shot.step === failedStep;
        }
        if (option === 'start') {
          return position === 0;
        }
        if (option === 'end') {
          return position === lastPosition;
        }
        // 'changed' — the last member in precedence order, so it only ever decides a middle shot
        // that is neither blank, the failing step, first, nor last.
        return (
          shot.pixelChange !== null &&
          Number(shot.pixelChange.slice(0, -perceptionStatics.pixelChange.percentSuffix.length)) >=
            perceptionStatics.pixelChange.openThresholdPercent
        );
      }) ?? null;

    return shotListingContract.parse({ ...shot, open: reason !== null, why: reason });
  });
};
