import type { StubArgument } from '@dungeonmaster/shared/@types';

import { orchestrationEventEnvelopeContract } from './orchestration-event-envelope-contract';
import type { OrchestrationEventEnvelope } from './orchestration-event-envelope-contract';

/**
 * Default stub — chat-output event with empty entries. Tests override `payload.entries` etc.
 */
export const OrchestrationEventEnvelopeStub = ({
  ...props
}: StubArgument<OrchestrationEventEnvelope> = {}): OrchestrationEventEnvelope =>
  orchestrationEventEnvelopeContract.parse({
    type: 'chat-output',
    processId: 'proc-stub',
    payload: { entries: [] },
    ...props,
  });
