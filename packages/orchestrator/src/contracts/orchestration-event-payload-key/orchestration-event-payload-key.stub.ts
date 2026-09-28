import { orchestrationEventPayloadKeyContract } from './orchestration-event-payload-key-contract';
import type { OrchestrationEventPayloadKey } from './orchestration-event-payload-key-contract';

export const OrchestrationEventPayloadKeyStub = (
  { value }: { value: string } = { value: 'questId' },
): OrchestrationEventPayloadKey => orchestrationEventPayloadKeyContract.parse(value);
