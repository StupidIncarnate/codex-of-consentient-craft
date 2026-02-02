import { orchestrationPhaseContract } from './orchestration-phase-contract';
import type { OrchestrationPhase } from './orchestration-phase-contract';

export const OrchestrationPhaseStub = (
  { value }: { value: OrchestrationPhase } = { value: 'idle' },
): OrchestrationPhase => orchestrationPhaseContract.parse(value);
