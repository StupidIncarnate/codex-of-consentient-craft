/**
 * PURPOSE: Resolves the next action for the PathSeeker phase based on pathseekerRuns state
 *
 * USAGE:
 * resolvePathseekerLayerBroker({quest});
 * // Returns: PhaseResolution or undefined if pathseeker is done
 */

import type { Quest } from '@dungeonmaster/shared/contracts';

import { phaseResolutionContract } from '../../../contracts/phase-resolution/phase-resolution-contract';
import type { PhaseResolution } from '../../../contracts/phase-resolution/phase-resolution-contract';
import { phaseResolverLimitsStatics } from '../../../statics/phase-resolver-limits/phase-resolver-limits-statics';

export const resolvePathseekerLayerBroker = ({
  quest,
}: {
  quest: Quest;
}): PhaseResolution | undefined => {
  const { pathseekerRuns } = quest;
  const lastRun = pathseekerRuns.at(-1);

  if (lastRun === undefined) {
    return phaseResolutionContract.parse({ action: 'launch-pathseeker' });
  }

  if (lastRun.status === 'complete') {
    return undefined;
  }

  if (lastRun.status === 'in_progress') {
    return lastRun.sessionId === undefined
      ? phaseResolutionContract.parse({ action: 'launch-pathseeker' })
      : phaseResolutionContract.parse({
          action: 'resume-pathseeker',
          resumeSessionId: lastRun.sessionId,
        });
  }

  if (
    lastRun.status === 'verification_failed' &&
    pathseekerRuns.length < phaseResolverLimitsStatics.maxPathseekerAttempts
  ) {
    return phaseResolutionContract.parse({ action: 'launch-pathseeker' });
  }

  if (
    lastRun.status === 'failed' ||
    pathseekerRuns.length >= phaseResolverLimitsStatics.maxPathseekerAttempts
  ) {
    return phaseResolutionContract.parse({
      action: 'blocked',
      context: 'PathSeeker failed after maximum attempts',
    });
  }

  return phaseResolutionContract.parse({ action: 'launch-pathseeker' });
};
