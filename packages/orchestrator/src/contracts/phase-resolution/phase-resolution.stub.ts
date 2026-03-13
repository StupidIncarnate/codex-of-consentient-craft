import type { StubArgument } from '@dungeonmaster/shared/@types';

import { phaseResolutionContract } from './phase-resolution-contract';
import type { PhaseResolution } from './phase-resolution-contract';

export const PhaseResolutionStub = ({
  ...props
}: StubArgument<PhaseResolution> = {}): PhaseResolution =>
  phaseResolutionContract.parse({
    action: 'launch-pathseeker',
    ...props,
  });
