import { phaseTypeContract } from './phase-type-contract';
import type { PhaseType } from './phase-type-contract';

export const PhaseTypeStub = ({ value }: { value?: PhaseType } = {}): PhaseType =>
  phaseTypeContract.parse(value ?? 'discovery');
