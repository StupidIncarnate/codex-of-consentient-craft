/**
 * PURPOSE: Owns the recurring health-status emit: one frame every
 * healthHeartbeatStatics.emitIntervalMs, broadcast unconditionally to every connected client.
 * Reach for this over building the tick inline at server-init-responder.ts — that responder is
 * the only place `clients` exists, but the tick itself belongs beside the other health-status
 * producers rather than growing that file's already-long body.
 *
 * USAGE:
 * const { stop } = healthHeartbeatStartBroker({ clients });
 * // Registers one interval; stop() clears it. The tick never gates on client count or content.
 */

import { wsMessageContract } from '@dungeonmaster/shared/contracts';

import { timerSetIntervalAdapter } from '../../../adapters/timer/set-interval/timer-set-interval-adapter';
import { isoTimestampContract } from '../../../contracts/iso-timestamp/iso-timestamp-contract';
import type { WsClient } from '../../../contracts/ws-client/ws-client-contract';
import { healthHeartbeatStatics } from '../../../statics/health-heartbeat/health-heartbeat-statics';
import { healthStatusSnapshotBroker } from '../../health-status/snapshot/health-status-snapshot-broker';
import { wsEventRelayBroadcastBroker } from '../../ws-event-relay/broadcast/ws-event-relay-broadcast-broker';

export const healthHeartbeatStartBroker = ({
  clients,
}: {
  clients: Set<WsClient>;
}): { stop: () => void } => {
  let stopped = false;

  const { stop: stopTimer } = timerSetIntervalAdapter({
    callback: (): void => {
      if (stopped) return;

      const envelope = wsMessageContract.parse({
        type: 'health-status',
        payload: healthStatusSnapshotBroker(),
        timestamp: isoTimestampContract.parse(new Date().toISOString()),
      });

      wsEventRelayBroadcastBroker({ clients, message: envelope });
    },
    intervalMs: healthHeartbeatStatics.emitIntervalMs,
  });

  return {
    stop: (): void => {
      stopped = true;
      stopTimer();
    },
  };
};
