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

export const orchestrationEventEnvelopeContract = z
  .object({
    type: z.string().brand<'OrchestrationEventEnvelopeType'>().optional(),
    processId: z.string().brand<'OrchestrationEventEnvelopeProcessId'>().optional(),
    payload: z.record(z.unknown()).optional(),
  })
  .passthrough();

export type OrchestrationEventEnvelope = z.infer<typeof orchestrationEventEnvelopeContract>;
