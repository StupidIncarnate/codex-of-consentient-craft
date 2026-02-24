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
  'agent-output',
  'process-complete',
  'process-failed',
  'chat-output',
  'chat-complete',
  'quest-created',
  'quest-modified',
]);

export type OrchestrationEventType = z.infer<typeof orchestrationEventTypeContract>;
