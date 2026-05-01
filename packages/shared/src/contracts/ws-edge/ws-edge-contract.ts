/**
 * PURPOSE: Defines the WsEdge structure linking an orchestrator event-bus emit site to
 * the server-side WebSocket consumer sites that dispatch on the same event type literal.
 *
 * USAGE:
 * wsEdgeContract.parse({
 *   eventType: 'chat-output',
 *   emitterFile: '/repo/packages/orchestrator/src/responders/chat/start/chat-start-responder.ts',
 *   consumerFiles: ['/repo/packages/server/src/bindings/use-quest-chat/use-quest-chat-binding.ts'],
 *   paired: true,
 * });
 * // Returns validated WsEdge
 *
 * WHEN-TO-USE: Building the WS-edges layer for the project-map EDGES footer
 */

import { z } from 'zod';
import { contentTextContract } from '../content-text/content-text-contract';
import { absoluteFilePathContract } from '../absolute-file-path/absolute-file-path-contract';

export const wsEdgeContract = z.object({
  eventType: contentTextContract,
  emitterFile: absoluteFilePathContract.nullable(),
  consumerFiles: z.array(absoluteFilePathContract),
  paired: z.boolean(),
});

export type WsEdge = z.infer<typeof wsEdgeContract>;
