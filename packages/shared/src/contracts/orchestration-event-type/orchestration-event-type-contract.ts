/**
 * PURPOSE: The one frame-type vocabulary the orchestrator bus, the server relay and the web channel
 * all agree on, so a name added here is a name all three may use. Membership does NOT mean "travels
 * the in-memory bus": some members are per-subscription and some originate in the server, so read
 * this as the shared namespace rather than as one emitter's output. Reach for this over
 * `wsMessageContract` when you want the vocabulary itself rather than the envelope carrying it.
 *
 * USAGE:
 * orchestrationEventTypeContract.parse('phase-change');
 * // Returns: OrchestrationEventType enum value
 */

import { z } from 'zod';

export const orchestrationEventTypeContract = z.enum([
  'phase-change',
  'slot-update',
  'progress-update',
  'process-complete',
  'process-failed',
  'chat-output',
  'chat-complete',
  'quest-created',
  'quest-modified',
  // Sent directly to a subscribing client when its quest could not be read (malformed quest.json).
  // Never emitted on the in-memory bus — it is per-subscription, and its payload carries the
  // field-level reason so the route can name what rejected instead of rendering nothing.
  'quest-load-failed',
  'quest-persisted',
  'quest-paused',
  'quest-resumed',
  'clarification-request',
  'chat-history-complete',
  'quest-session-linked',
  'chat-session-started',
  'execution-queue-updated',
  'execution-queue-error',
  'rate-limits-updated',
  'dispatch-state-changed',
  'health-status',
]);

export type OrchestrationEventType = z.infer<typeof orchestrationEventTypeContract>;
