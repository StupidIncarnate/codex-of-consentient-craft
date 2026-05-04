/**
 * PURPOSE: Defines the WsEdge structure linking an in-process bus emit site to the
 * WebSocket consumer sites that dispatch on the same event type literal, plus the
 * gateway file (the file that owns the WS transport boundary, identified by its
 * dependency on a WS-server npm package). The gateway is the correct attribution
 * for the consumer's `ws←` arrow — the emitter alone is the bus origin, not the
 * file that broadcasts the WS frame.
 *
 * USAGE:
 * wsEdgeContract.parse({
 *   eventType: 'chat-output',
 *   emitterFile: '/repo/packages/orchestrator/src/responders/chat/start/chat-start-responder.ts',
 *   consumerFiles: ['/repo/packages/web/src/bindings/use-quest-chat/use-quest-chat-binding.ts'],
 *   wsGatewayFile: '/repo/packages/server/src/responders/server/init/server-init-responder.ts',
 *   paired: true,
 * });
 * // Returns validated WsEdge
 *
 * WHEN-TO-USE: Building the WS-edges layer for project-map renderers that need to
 * attribute a WS frame to its gateway file.
 */

import { z } from 'zod';
import { contentTextContract } from '../content-text/content-text-contract';
import { absoluteFilePathContract } from '../absolute-file-path/absolute-file-path-contract';

export const wsEdgeContract = z.object({
  eventType: contentTextContract,
  emitterFile: absoluteFilePathContract.nullable(),
  consumerFiles: z.array(absoluteFilePathContract),
  wsGatewayFile: absoluteFilePathContract.nullable(),
  paired: z.boolean(),
});

export type WsEdge = z.infer<typeof wsEdgeContract>;
