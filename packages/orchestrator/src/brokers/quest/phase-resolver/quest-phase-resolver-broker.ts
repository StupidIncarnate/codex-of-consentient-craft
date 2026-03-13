/**
 * PURPOSE: Pure decision function that determines the next orchestration action for a quest
 *
 * USAGE:
 * const resolution = questPhaseResolverBroker({quest});
 * // Returns: {action: 'launch-pathseeker'} or similar PhaseResolution
 */

import type { Quest } from '@dungeonmaster/shared/contracts';

import { phaseResolutionContract } from '../../../contracts/phase-resolution/phase-resolution-contract';
import type { PhaseResolution } from '../../../contracts/phase-resolution/phase-resolution-contract';
import { resolveInProgressLayerBroker } from './resolve-in-progress-layer-broker';

export const questPhaseResolverBroker = ({ quest }: { quest: Quest }): PhaseResolution => {
  const { status } = quest;

  if (status === 'created' || status === 'pending') {
    return phaseResolutionContract.parse({ action: 'launch-chat', role: 'chaoswhisperer' });
  }

  if (status === 'explore_flows') {
    return quest.questCreatedSessionBy === undefined
      ? phaseResolutionContract.parse({ action: 'launch-chat', role: 'chaoswhisperer' })
      : phaseResolutionContract.parse({
          action: 'resume-chat',
          role: 'chaoswhisperer',
          resumeSessionId: quest.questCreatedSessionBy,
        });
  }

  if (status === 'review_flows') {
    return phaseResolutionContract.parse({
      action: 'wait-for-user',
      context: 'User must approve flows (Gate 1)',
    });
  }

  if (status === 'flows_approved') {
    return quest.questCreatedSessionBy === undefined
      ? phaseResolutionContract.parse({ action: 'launch-chat', role: 'chaoswhisperer' })
      : phaseResolutionContract.parse({
          action: 'resume-chat',
          role: 'chaoswhisperer',
          resumeSessionId: quest.questCreatedSessionBy,
        });
  }

  if (status === 'explore_observables') {
    return quest.questCreatedSessionBy === undefined
      ? phaseResolutionContract.parse({ action: 'launch-chat', role: 'chaoswhisperer' })
      : phaseResolutionContract.parse({
          action: 'resume-chat',
          role: 'chaoswhisperer',
          resumeSessionId: quest.questCreatedSessionBy,
        });
  }

  if (status === 'review_observables') {
    return phaseResolutionContract.parse({
      action: 'wait-for-user',
      context: 'User must approve observables (Gate 2)',
    });
  }

  if (status === 'approved' && quest.needsDesign) {
    return phaseResolutionContract.parse({
      action: 'wait-for-user',
      context: 'User chooses: start quest or start design',
    });
  }

  if (status === 'explore_design') {
    return quest.designSessionBy === undefined
      ? phaseResolutionContract.parse({ action: 'launch-chat', role: 'glyphsmith' })
      : phaseResolutionContract.parse({
          action: 'resume-chat',
          role: 'glyphsmith',
          resumeSessionId: quest.designSessionBy,
        });
  }

  if (status === 'review_design') {
    return phaseResolutionContract.parse({
      action: 'wait-for-user',
      context: 'User must approve designs',
    });
  }

  if (status === 'approved') {
    return phaseResolutionContract.parse({
      action: 'wait-for-user',
      context: 'User must click start quest',
    });
  }

  if (status === 'design_approved') {
    return phaseResolutionContract.parse({
      action: 'wait-for-user',
      context: 'User must click start quest',
    });
  }

  if (status === 'in_progress') {
    return resolveInProgressLayerBroker({ quest });
  }

  if (status === 'complete') {
    return phaseResolutionContract.parse({ action: 'wait-for-user', context: 'Quest complete' });
  }

  if (status === 'abandoned') {
    return phaseResolutionContract.parse({ action: 'wait-for-user', context: 'Quest abandoned' });
  }

  return phaseResolutionContract.parse({
    action: 'wait-for-user',
    context: 'Quest blocked, needs intervention',
  });
};
