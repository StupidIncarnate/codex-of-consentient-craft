/**
 * PURPOSE: A key into an orchestration event's untyped `payload` record — the bus is a pub/sub for
 * many event types (chat-output, phase-change, etc.), so per-variant payload shapes are validated by
 * their own consumer at the boundary rather than here. A caller reading a known key (e.g.
 * `'questId'`, `'chatProcessId'`) re-parses it through this contract to index the branded `Record`
 * `orchestrationEventEnvelopeContract`'s `payload` field returns.
 *
 * USAGE:
 * orchestrationEventPayloadKeyContract.parse('questId');
 * // Returns a branded OrchestrationEventPayloadKey
 */
import { z } from '#gateway/npm/zod';

export const orchestrationEventPayloadKeyContract = z
  .string()
  .brand<'OrchestrationEventPayloadKey'>();

export type OrchestrationEventPayloadKey = z.infer<typeof orchestrationEventPayloadKeyContract>;
