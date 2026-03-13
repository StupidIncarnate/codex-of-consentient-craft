/**
 * PURPOSE: Resolves the next action for a quest in 'in_progress' status by walking the execution sub-tree
 *
 * USAGE:
 * resolveInProgressLayerBroker({quest});
 * // Returns: PhaseResolution for pathseeker/codeweaver/ward/siegemaster/lawbringer/complete
 */

import type { Quest } from '@dungeonmaster/shared/contracts';

import { phaseResolutionContract } from '../../../contracts/phase-resolution/phase-resolution-contract';
import type { PhaseResolution } from '../../../contracts/phase-resolution/phase-resolution-contract';
import { resolveCodeweaverLayerBroker } from './resolve-codeweaver-layer-broker';
import { resolveLawbringerLayerBroker } from './resolve-lawbringer-layer-broker';
import { resolvePathseekerLayerBroker } from './resolve-pathseeker-layer-broker';
import { resolveSiegemasterLayerBroker } from './resolve-siegemaster-layer-broker';
import { resolveWardLayerBroker } from './resolve-ward-layer-broker';

export const resolveInProgressLayerBroker = ({ quest }: { quest: Quest }): PhaseResolution => {
  const pathseekerResult = resolvePathseekerLayerBroker({ quest });

  if (pathseekerResult !== undefined) {
    return pathseekerResult;
  }

  const codeweaverResult = resolveCodeweaverLayerBroker({ quest });

  if (codeweaverResult !== undefined) {
    return codeweaverResult;
  }

  const wardResult = resolveWardLayerBroker({ quest });

  if (wardResult !== undefined) {
    return wardResult;
  }

  const siegemasterResult = resolveSiegemasterLayerBroker({ quest });

  if (siegemasterResult !== undefined) {
    return siegemasterResult;
  }

  const lawbringerResult = resolveLawbringerLayerBroker({ quest });

  if (lawbringerResult !== undefined) {
    return lawbringerResult;
  }

  return phaseResolutionContract.parse({ action: 'complete' });
};
