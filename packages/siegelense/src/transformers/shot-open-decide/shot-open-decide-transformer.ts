/**
 * PURPOSE: Pure policy over one run's raw shot list — flips `open: true` on the FIRST shot ('start'),
 * the LAST ('end'), and the one whose `step` matches `failedStep` ('failed'), leaving every other shot
 * closed (siegelense-tooling.md line 1592: "capturing is cheap and opening costs real context...
 * Putting the policy in the response rather than in prompt text means no prompt carries it, no session
 * remembers it, and 'did I get a screenshot here?' is answered before it is asked"). A shot that is
 * BOTH a positional pick and the failing step reports `'failed'` — the more diagnostic reason wins
 * over mere position. Reach for this over deciding the flag inline inside `runExecuteBroker`: keeping
 * the policy pure is what lets it be proven with no browser and no captured file at all.
 *
 * USAGE:
 * shotOpenDecideTransformer({
 *   shots: [ShotListingStub({ step: 1, open: false, why: null }), ShotListingStub({ step: 2, open: false, why: null })],
 *   failedStep: null,
 * });
 * // Returns the same two shots, the first flagged open/'start', the last flagged open/'end'
 */

import { shotListingContract } from '../../contracts/shot-listing/shot-listing-contract';
import type { ShotListing } from '../../contracts/shot-listing/shot-listing-contract';
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
    if (failedStep !== null && shot.step === failedStep) {
      return shotListingContract.parse({ ...shot, open: true, why: 'failed' });
    }
    if (position === 0) {
      return shotListingContract.parse({ ...shot, open: true, why: 'start' });
    }
    if (position === lastPosition) {
      return shotListingContract.parse({ ...shot, open: true, why: 'end' });
    }
    return shotListingContract.parse({ ...shot, open: false, why: null });
  });
};
