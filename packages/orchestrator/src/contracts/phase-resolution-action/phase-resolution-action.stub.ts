import { phaseResolutionActionContract } from './phase-resolution-action-contract';
import type { PhaseResolutionAction } from './phase-resolution-action-contract';

export const PhaseResolutionActionStub = (
  { value }: { value: string } = { value: 'launch-pathseeker' },
): PhaseResolutionAction => phaseResolutionActionContract.parse(value);
