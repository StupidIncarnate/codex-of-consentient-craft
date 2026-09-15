/**
 * PURPOSE: True when `step`'s member carries a `target` selector — `waitFor`, `click` and `type`,
 * the three members `stepContract`'s discriminated union gives a `target` field
 * (siegelense-tooling.md line 1961's ambiguity rule applies to exactly these three). Reads the
 * member's own shape via `'target' in step` rather than a parallel statics list, because the
 * discriminated union already IS the source of truth for which members carry the field — a
 * `goto`/`screenshot`/`eval` step parses with no `target` key at all, so no list can drift from it.
 *
 * USAGE:
 * isTargetingStepGuard({ step: StepStub({ step: 'click', target: SelectorStub() }) });
 * // Returns true
 */

import type { Step } from '../../contracts/step/step-contract';

export const isTargetingStepGuard = ({ step }: { step?: Step }): boolean => {
  if (!step) {
    return false;
  }

  return 'target' in step;
};
