/**
 * PURPOSE: Defines the WebSocket message envelope used for real-time communication between server and web client
 *
 * USAGE:
 * wsMessageContract.parse({type: 'phase-change', payload: {processId: 'proc-123', phase: 'codeweaver'}, timestamp: '2025-01-01T00:00:00.000Z'});
 * // Returns: WsMessage object
 */

import { z } from 'zod';

import { orchestrationEventTypeContract } from '../orchestration-event-type/orchestration-event-type-contract';

export const wsMessageContract = z.object({
  type: orchestrationEventTypeContract,
  payload: z.record(z.string().brand<'PayloadKey'>(), z.unknown()),
  timestamp: z.string().datetime().brand<'IsoTimestamp'>(),
});

export type WsMessage = z.infer<typeof wsMessageContract>;
