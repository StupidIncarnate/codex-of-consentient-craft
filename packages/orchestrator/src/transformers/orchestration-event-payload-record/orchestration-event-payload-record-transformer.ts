/**
 * PURPOSE: Returns the `payload` record from an `orchestrationEventsState.emit` envelope, validated
 * via the orchestration-event-envelope contract. Returns an `OrchestrationEventEnvelope['payload']`
 * (a Record<string, unknown>) whose keys can be inspected by integration-test assertion helpers
 * without reaching into the event with Reflect.get.
 *
 * USAGE:
 * const payload = orchestrationEventPayloadRecordTransformer({ event });
 * payload?.['entries']; // unknown — narrow at the call site
 */
import {
  orchestrationEventEnvelopeContract,
  type OrchestrationEventEnvelope,
} from '../../contracts/orchestration-event-envelope/orchestration-event-envelope-contract';

export const orchestrationEventPayloadRecordTransformer = ({
  event,
}: {
  event: unknown;
}): OrchestrationEventEnvelope['payload'] => {
  const parsed = orchestrationEventEnvelopeContract.safeParse(event);
  if (!parsed.success) return undefined;
  return parsed.data.payload;
};
