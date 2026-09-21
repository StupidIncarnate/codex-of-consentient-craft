/**
 * PURPOSE: Classifies a failed riftcarver carve into the one of two outcomes a carve step can
 * reach on its own account — `unmet` (repairable: earns a spiritmender pass and a fresh `pt N`
 * carve) or `wall` (git-state: no worktree exists to send a repair into, so the quest halts).
 * Derives the step→class lookup from `worktreePrepareStepStatics.classifications` via
 * `Object.entries` rather than a listed table, so an eighth step added later fails loudly instead
 * of silently defaulting to `wall`. `isPermissionDeniedErrorGuard` is checked FIRST and overrides
 * whatever class the step itself carries — no fresh session of any role can talk an operator's
 * filesystem out of saying no, whatever step surfaced the denial.
 *
 * USAGE:
 * riftcarverFailureClassifyTransformer({ failedStep: 'typecheck', error: new Error('TS2322') });
 * // Returns 'unmet' — typecheck classifies 'repairable'
 *
 * riftcarverFailureClassifyTransformer({ failedStep: 'create', error: new Error('...') });
 * // Returns 'wall' — create classifies 'git-state'
 *
 * riftcarverFailureClassifyTransformer({
 *   failedStep: 'typecheck',
 *   error: new Error('EACCES: permission denied'),
 * });
 * // Returns 'wall' — the permission denial overrides typecheck's own 'repairable' class
 */

import { stepOutcomeContract } from '../../contracts/step-outcome/step-outcome-contract';
import type { StepOutcome } from '../../contracts/step-outcome/step-outcome-contract';
import { isPermissionDeniedErrorGuard } from '../../guards/is-permission-denied-error/is-permission-denied-error-guard';
import { worktreePrepareStepStatics } from '../../statics/worktree-prepare-step/worktree-prepare-step-statics';

const CLASSIFICATION_BY_STEP = new Map(Object.entries(worktreePrepareStepStatics.classifications));

export const riftcarverFailureClassifyTransformer = ({
  failedStep,
  error,
}: {
  failedStep: string;
  error?: unknown;
}): StepOutcome => {
  if (isPermissionDeniedErrorGuard({ error })) {
    return stepOutcomeContract.parse('wall');
  }

  const classification = CLASSIFICATION_BY_STEP.get(failedStep);

  return stepOutcomeContract.parse(classification === 'repairable' ? 'unmet' : 'wall');
};
