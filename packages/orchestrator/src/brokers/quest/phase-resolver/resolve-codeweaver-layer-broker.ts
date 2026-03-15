/**
 * PURPOSE: Resolves the next action for the Codeweaver phase based on step statuses
 *
 * USAGE:
 * resolveCodeweaverLayerBroker({quest});
 * // Returns: PhaseResolution or undefined if all steps are done
 */

import type { Quest } from '@dungeonmaster/shared/contracts';

import { phaseResolutionContract } from '../../../contracts/phase-resolution/phase-resolution-contract';
import type { PhaseResolution } from '../../../contracts/phase-resolution/phase-resolution-contract';

const ACTIVE_STATUSES = new Set(['pending', 'in_progress', 'partially_complete', 'blocked']);
const RESET_STATUSES = new Set(['in_progress', 'partially_complete', 'blocked']);

export const resolveCodeweaverLayerBroker = ({
  quest,
}: {
  quest: Quest;
}): PhaseResolution | undefined => {
  const hasActiveSteps = quest.steps.some((step) => ACTIVE_STATUSES.has(step.status));

  if (!hasActiveSteps) {
    return undefined;
  }

  const resetStepIds = quest.steps
    .filter((step) => RESET_STATUSES.has(step.status))
    .map((step) => step.id);

  return phaseResolutionContract.parse({
    action: 'launch-codeweaver',
    ...(resetStepIds.length > 0 ? { resetStepIds } : {}),
  });
};
