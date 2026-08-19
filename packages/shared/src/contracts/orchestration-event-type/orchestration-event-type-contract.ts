/**
 * PURPOSE: The single enumeration point for real-time event names. wsMessageContract.type validates
 * against it, and server-init-responder iterates its members in declaration order to register the
 * bus relay subscriptions — so a member added here widens both the wire vocabulary and that
 * subscription set, and members are never reordered. Reaching the in-memory bus is the common case,
 * not a guarantee: quest-load-failed is per-subscription, and health-updated is broadcast straight
 * to WS clients.
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
  'health-updated',
]);

export type OrchestrationEventType = z.infer<typeof orchestrationEventTypeContract>;
