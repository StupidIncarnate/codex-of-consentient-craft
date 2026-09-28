/**
 * PURPOSE: Validates a generic orchestration event envelope `{ type, processId, payload }` as broadcast
 * by `orchestrationEventsState.emit`. Each event's `payload` is a Record because the bus is a
 * pub/sub for many event types (chat-output, phase-change, etc.); per-variant payloads are validated
 * by their own consumer at the boundary.
 *
 * USAGE:
 * const env = orchestrationEventEnvelopeContract.parse(rawEvent);
 * const entries = env.payload?.['entries'];
 */
import { z } from 'zod';

import { orchestrationEventPayloadKeyContract } from '../orchestration-event-payload-key/orchestration-event-payload-key-contract';

export const orchestrationEventEnvelopeContract = z
  .object({
    type: z.string().brand<'OrchestrationEventEnvelopeType'>().optional(),
    processId: z.string().brand<'OrchestrationEventEnvelopeProcessId'>().optional(),
    payload: z.record(orchestrationEventPayloadKeyContract, z.unknown()).optional(),
  })
  .loose();

export type OrchestrationEventEnvelope = z.infer<typeof orchestrationEventEnvelopeContract>;
