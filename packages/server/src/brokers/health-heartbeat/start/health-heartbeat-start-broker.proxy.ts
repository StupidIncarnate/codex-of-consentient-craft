import { registerSpyOn } from '@dungeonmaster/testing/register-mock';
import type { WsMessage } from '@dungeonmaster/shared/contracts';

import { timerSetIntervalAdapterProxy } from '../../../adapters/timer/set-interval/timer-set-interval-adapter.proxy';
import type { WsClient } from '../../../contracts/ws-client/ws-client-contract';
import { healthHeartbeatStatics } from '../../../statics/health-heartbeat/health-heartbeat-statics';
import { healthStatusSnapshotBrokerProxy } from '../../health-status/snapshot/health-status-snapshot-broker.proxy';
import { wsEventRelayBroadcastBrokerProxy } from '../../ws-event-relay/broadcast/ws-event-relay-broadcast-broker.proxy';

export const healthHeartbeatStartBrokerProxy = (): {
  captureClient: WsClient;
  setupSnapshot: (params: { uptimeSeconds: number; version: string }) => void;
  triggerTick: () => void;
  getCapturedMessages: () => WsMessage[];
  getClearedTimerHandles: () => readonly unknown[];
} => {
  const timerProxy = timerSetIntervalAdapterProxy({
    intervalMs: healthHeartbeatStatics.emitIntervalMs,
  });
  const snapshotProxy = healthStatusSnapshotBrokerProxy();
  const relayProxy = wsEventRelayBroadcastBrokerProxy();

  const dateSpy = registerSpyOn({
    object: Date.prototype,
    method: 'toISOString',
    passthrough: true,
  });
  dateSpy.calledWith([]).returns('2024-01-01T00:00:00.000Z');

  return {
    captureClient: relayProxy.captureClient,
    setupSnapshot: (params: { uptimeSeconds: number; version: string }): void => {
      snapshotProxy.setupSnapshot(params);
    },
    triggerTick: (): void => {
      timerProxy.triggerTick();
    },
    getCapturedMessages: (): WsMessage[] => relayProxy.getCapturedMessages(),
    // The timer proxy's fake setInterval always hands back the handle `0`, so `[0]` is the
    // handle the broker's own `clearInterval` really receives — the same assertion shape
    // timer-set-interval-adapter.test.ts uses. Reads the real teardown rather than the
    // broker's internal `stopped` guard, which suppresses a tick without clearing anything.
    getClearedTimerHandles: (): readonly unknown[] => timerProxy.getClearedHandles(),
  };
};
