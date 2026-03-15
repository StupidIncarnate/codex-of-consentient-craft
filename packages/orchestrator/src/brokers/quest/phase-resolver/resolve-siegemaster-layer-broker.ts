/**
 * PURPOSE: Resolves the next action for the Siegemaster phase based on execution log state
 *
 * USAGE:
 * resolveSiegemasterLayerBroker({quest});
 * // Returns: PhaseResolution or undefined if siegemaster has passed and is not invalidated
 */

import { agentTypeContract } from '@dungeonmaster/shared/contracts';
import type { Quest } from '@dungeonmaster/shared/contracts';

import { phaseResolutionContract } from '../../../contracts/phase-resolution/phase-resolution-contract';
import type { PhaseResolution } from '../../../contracts/phase-resolution/phase-resolution-contract';
import { isPhaseInvalidatedGuard } from '../../../guards/is-phase-invalidated/is-phase-invalidated-guard';
import { phaseResolverLimitsStatics } from '../../../statics/phase-resolver-limits/phase-resolver-limits-statics';
import { executionLogAgentSummaryTransformer } from '../../../transformers/execution-log-agent-summary/execution-log-agent-summary-transformer';
import { failedObservablesToStepIdsTransformer } from '../../../transformers/failed-observables-to-step-ids/failed-observables-to-step-ids-transformer';

export const resolveSiegemasterLayerBroker = ({
  quest,
}: {
  quest: Quest;
}): PhaseResolution | undefined => {
  const { lastEntry, failCount } = executionLogAgentSummaryTransformer({
    executionLog: quest.executionLog,
    agentType: agentTypeContract.parse('siegemaster'),
    resetAfterAgentType: agentTypeContract.parse('codeweaver'),
  });

  if (lastEntry === undefined) {
    return phaseResolutionContract.parse({ action: 'launch-siegemaster' });
  }

  if (failCount >= phaseResolverLimitsStatics.maxSiegemasterFailures) {
    return phaseResolutionContract.parse({
      action: 'blocked',
      context: 'Siegemaster failed 2 times',
    });
  }

  if (
    lastEntry.status === 'pass' &&
    isPhaseInvalidatedGuard({
      executionLog: quest.executionLog,
      agentType: agentTypeContract.parse('siegemaster'),
      prerequisiteType: agentTypeContract.parse('ward'),
    })
  ) {
    return phaseResolutionContract.parse({ action: 'launch-siegemaster' });
  }

  if (lastEntry.status === 'fail') {
    const resetStepIds = failedObservablesToStepIdsTransformer({
      failedObservableIds: lastEntry.failedObservableIds,
      steps: quest.steps,
    });

    return resetStepIds.length > 0
      ? phaseResolutionContract.parse({ action: 'launch-codeweaver', resetStepIds })
      : phaseResolutionContract.parse({ action: 'launch-codeweaver' });
  }

  if (lastEntry.status === 'pass') {
    return undefined;
  }

  return phaseResolutionContract.parse({ action: 'launch-siegemaster' });
};
