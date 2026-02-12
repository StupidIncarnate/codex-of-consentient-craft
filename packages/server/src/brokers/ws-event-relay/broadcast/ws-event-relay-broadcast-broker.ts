/**
 * PURPOSE: Broadcasts a JSON message to all connected WebSocket clients, removing dead clients on send failure
 *
 * USAGE:
 * const deadClients = wsEventRelayBroadcastBroker({clients, message});
 * // Returns set of clients that failed to receive the message (dead clients removed from input set)
 */

import type { WsMessage } from '@dungeonmaster/shared/contracts';

import type { WsClient } from '../../../contracts/ws-client/ws-client-contract';

export const wsEventRelayBroadcastBroker = ({
  clients,
  message,
}: {
  clients: Set<WsClient>;
  message: WsMessage;
}): Set<WsClient> => {
  const deadClients = new Set<WsClient>();
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
