/**
 * PURPOSE: Resolves the next action for the Ward phase based on execution log state
 *
 * USAGE:
 * resolveWardLayerBroker({quest});
 * // Returns: PhaseResolution or undefined if ward has passed and is not invalidated
 */

import { agentTypeContract } from '@dungeonmaster/shared/contracts';
import type { Quest } from '@dungeonmaster/shared/contracts';

import { phaseResolutionContract } from '../../../contracts/phase-resolution/phase-resolution-contract';
import type { PhaseResolution } from '../../../contracts/phase-resolution/phase-resolution-contract';
import { isPhaseInvalidatedGuard } from '../../../guards/is-phase-invalidated/is-phase-invalidated-guard';
import { phaseResolverLimitsStatics } from '../../../statics/phase-resolver-limits/phase-resolver-limits-statics';
import { executionLogAgentSummaryTransformer } from '../../../transformers/execution-log-agent-summary/execution-log-agent-summary-transformer';

export const resolveWardLayerBroker = ({
  quest,
}: {
  quest: Quest;
}): PhaseResolution | undefined => {
  const { lastEntry, failCount } = executionLogAgentSummaryTransformer({
    executionLog: quest.executionLog,
    agentType: agentTypeContract.parse('ward'),
  });

  if (lastEntry === undefined) {
    return phaseResolutionContract.parse({ action: 'launch-ward' });
  }

  if (failCount >= phaseResolverLimitsStatics.maxWardFailures) {
    return phaseResolutionContract.parse({ action: 'blocked', context: 'Ward failed 3 times' });
  }

  if (lastEntry.status === 'fail') {
    return phaseResolutionContract.parse({ action: 'launch-ward' });
  }

  if (
    lastEntry.status === 'pass' &&
    isPhaseInvalidatedGuard({
      executionLog: quest.executionLog,
      agentType: agentTypeContract.parse('ward'),
      prerequisiteType: agentTypeContract.parse('codeweaver'),
    })
  ) {
    return phaseResolutionContract.parse({ action: 'launch-ward' });
  }

  if (lastEntry.status === 'pass') {
    return undefined;
  }

  return phaseResolutionContract.parse({ action: 'launch-ward' });
};
