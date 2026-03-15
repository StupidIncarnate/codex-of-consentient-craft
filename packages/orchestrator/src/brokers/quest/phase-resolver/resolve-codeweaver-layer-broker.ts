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

export const resolveCodeweaverLayerBroker = ({
  quest,
}: {
  quest: Quest;
}): PhaseResolution | undefined => {
  const hasActiveSteps = quest.steps.some(
    (step) =>
      step.status === 'pending' ||
      step.status === 'in_progress' ||
      step.status === 'partially_complete',
  );

  if (hasActiveSteps) {
    return phaseResolutionContract.parse({ action: 'launch-codeweaver' });
  }

  return undefined;
};
