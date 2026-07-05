import { orchestrationModeContract } from './orchestration-mode-contract';
import type { OrchestrationMode } from './orchestration-mode-contract';

export const OrchestrationModeStub = ({
  value,
}: { value?: OrchestrationMode } = {}): OrchestrationMode =>
  orchestrationModeContract.parse(value ?? 'claude');
