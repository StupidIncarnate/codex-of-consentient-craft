/**
 * PURPOSE: True when `verb` is one of the six this chunk ships, all of which act on or read a live
 * Playwright page (`stepStatics.verbs.browser`, siegelense-tooling.md lines 1613, 2128-2130). The
 * dispatcher reads this to refuse a browser step by NAME against a browserless spec's `LaneSession`
 * rather than answering an empty reading — this chunk's every verb is a browser verb, so the guard
 * exists for the boundary itself and for the non-browser verbs a later chunk adds to the enum
 * without this guard's callers changing.
 *
 * USAGE:
 * isBrowserStepGuard({ verb: StepVerbStub({ value: 'click' }) });
 * // Returns true
 */

import type { StepVerb } from '../../contracts/step-verb/step-verb-contract';
import { stepStatics } from '../../statics/step/step-statics';

export const isBrowserStepGuard = ({ verb }: { verb?: StepVerb }): boolean => {
  if (!verb) {
    return false;
  }

  // `.some` rather than `.includes`: `verbs.browser` is a narrower tuple than `verbs.all` now that
  // `seed` is in one and not the other, and `.includes` types its argument against the ARRAY's
  // member union — so a StepVerb that is legitimately absent from this list would not typecheck.
  return stepStatics.verbs.browser.some((candidate) => candidate === verb);
};
