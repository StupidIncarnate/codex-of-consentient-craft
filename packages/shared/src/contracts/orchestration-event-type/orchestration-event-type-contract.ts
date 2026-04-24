/**
 * PURPOSE: Defines the event types emitted by the orchestrator event bus
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
  'quest-persisted',
  'clarification-request',
  'chat-patch',
  'chat-history-complete',
  'quest-session-linked',
  'chat-session-started',
  'execution-queue-updated',
  'execution-queue-error',
]);

export type OrchestrationEventType = z.infer<typeof orchestrationEventTypeContract>;
