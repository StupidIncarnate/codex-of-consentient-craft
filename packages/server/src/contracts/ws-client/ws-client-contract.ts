/**
 * PURPOSE: Defines the WsClient type representing a connected WebSocket client with a send method
 *
 * USAGE:
 * const client: WsClient = {send: (data) => ws.send(data)};
 * // Type for WebSocket client abstraction used in broadcast broker
 */

import { z } from 'zod';

export interface WsClient {
  send: (data: string) => void;
}

export const wsClientContract = z.custom<WsClient>();
