import { phaseStatusContract } from './phase-status-contract';
import type { PhaseStatus } from './phase-status-contract';

export const PhaseStatusStub = ({ value }: { value?: PhaseStatus } = {}): PhaseStatus =>
  phaseStatusContract.parse(value ?? 'pending');
