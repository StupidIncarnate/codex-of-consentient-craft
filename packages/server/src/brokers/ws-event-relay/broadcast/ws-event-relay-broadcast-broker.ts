/**
 * PURPOSE: Broadcasts a JSON message to all connected WebSocket clients, removing dead clients on send failure
 *
 * USAGE:
 * const deadClients = wsEventRelayBroadcastBroker({clients, message});
 * // Returns set of clients that failed to receive the message (dead clients removed from input set)
 */

import type { WsMessage } from '@dungeonmaster/shared/contracts';

import type { WSContext } from '#gateway/npm/hono__ws';

export const wsEventRelayBroadcastBroker = ({
  clients,
  message,
}: {
  clients: Set<WSContext>;
  message: WsMessage;
}): Set<WSContext> => {
  const deadClients = new Set<WSContext>();
  const serialized = JSON.stringify(message);

  for (const client of clients) {
    try {
      client.send(serialized);
    } catch {
      clients.delete(client);
      deadClients.add(client);
    }
  }

  return deadClients;
};
