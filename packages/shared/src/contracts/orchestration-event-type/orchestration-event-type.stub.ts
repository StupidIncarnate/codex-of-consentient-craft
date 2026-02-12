import { orchestrationEventTypeContract } from './orchestration-event-type-contract';
import type { OrchestrationEventType } from './orchestration-event-type-contract';

export const OrchestrationEventTypeStub = (
  { value }: { value: string } = { value: 'phase-change' },
): OrchestrationEventType => orchestrationEventTypeContract.parse(value);
