/**
 * PURPOSE: Resolves the next action for the Lawbringer phase based on execution log state
 *
 * USAGE:
 * resolveLawbringerLayerBroker({quest});
 * // Returns: PhaseResolution or undefined if lawbringer has passed and is not invalidated
 */

import { agentTypeContract } from '@dungeonmaster/shared/contracts';
import type { Quest } from '@dungeonmaster/shared/contracts';

import { phaseResolutionContract } from '../../../contracts/phase-resolution/phase-resolution-contract';
import type { PhaseResolution } from '../../../contracts/phase-resolution/phase-resolution-contract';
import { isPhaseInvalidatedGuard } from '../../../guards/is-phase-invalidated/is-phase-invalidated-guard';
import { phaseResolverLimitsStatics } from '../../../statics/phase-resolver-limits/phase-resolver-limits-statics';
import { executionLogAgentSummaryTransformer } from '../../../transformers/execution-log-agent-summary/execution-log-agent-summary-transformer';

export const resolveLawbringerLayerBroker = ({
  quest,
}: {
  quest: Quest;
}): PhaseResolution | undefined => {
  const { lastEntry, failCount } = executionLogAgentSummaryTransformer({
    executionLog: quest.executionLog,
    agentType: agentTypeContract.parse('lawbringer'),
    resetAfterAgentType: agentTypeContract.parse('siegemaster'),
  });

  if (lastEntry === undefined) {
    return phaseResolutionContract.parse({ action: 'launch-lawbringer' });
  }

  if (failCount >= phaseResolverLimitsStatics.maxLawbringerFailures) {
    return phaseResolutionContract.parse({
      action: 'blocked',
      context: 'Lawbringer failed 2 times',
    });
  }

  if (
    lastEntry.status === 'pass' &&
    isPhaseInvalidatedGuard({
      executionLog: quest.executionLog,
      agentType: agentTypeContract.parse('lawbringer'),
      prerequisiteType: agentTypeContract.parse('siegemaster'),
    })
  ) {
    return phaseResolutionContract.parse({ action: 'launch-lawbringer' });
  }

  if (lastEntry.status === 'fail') {
    return phaseResolutionContract.parse({ action: 'launch-lawbringer' });
  }

  if (lastEntry.status === 'pass') {
    return undefined;
  }

  return phaseResolutionContract.parse({ action: 'launch-lawbringer' });
};
