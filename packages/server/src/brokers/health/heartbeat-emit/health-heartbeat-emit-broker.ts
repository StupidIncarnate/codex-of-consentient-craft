/**
 * PURPOSE: Wraps the current HealthStatusPayload in a health-status WsMessage envelope and fans it
 * out to every connected client, reusing wsEventRelayBroadcastBroker so a throwing client's send is
 * handled the same way every other broadcast frame already is.
 *
 * USAGE:
 * const deadClients = healthHeartbeatEmitBroker({clients});
 * // Returns the Set of clients dropped from `clients` because their send threw during this emit
 */
import { wsMessageContract } from '@dungeonmaster/shared/contracts';

import type { WsClient } from '../../../contracts/ws-client/ws-client-contract';
import { isoTimestampContract } from '../../../contracts/iso-timestamp/iso-timestamp-contract';
import { wsEventRelayBroadcastBroker } from '../../ws-event-relay/broadcast/ws-event-relay-broadcast-broker';
import { healthStatusBroker } from '../status/health-status-broker';

export const healthHeartbeatEmitBroker = ({
  clients,
}: {
  clients: Set<WsClient>;
}): Set<WsClient> => {
  const message = wsMessageContract.parse({
    type: 'health-status',
    payload: healthStatusBroker(),
    timestamp: isoTimestampContract.parse(new Date().toISOString()),
  });

  return wsEventRelayBroadcastBroker({ clients, message });
};
