import { registerSpyOn } from '@dungeonmaster/testing/register-mock';
import type { WsMessage } from '@dungeonmaster/shared/contracts';

import type { WsClient } from '../../../contracts/ws-client/ws-client-contract';
import { wsEventRelayBroadcastBrokerProxy } from '../../ws-event-relay/broadcast/ws-event-relay-broadcast-broker.proxy';
import { healthStatusBrokerProxy } from '../status/health-status-broker.proxy';

export const healthHeartbeatEmitBrokerProxy = (): {
  stagesHealth: (params: { uptime: number; version: string }) => void;
  captureClient: WsClient;
  getCapturedMessages: () => WsMessage[];
} => {
  const healthProxy = healthStatusBrokerProxy();
  const relayProxy = wsEventRelayBroadcastBrokerProxy();

  const dateSpy = registerSpyOn({
    object: Date.prototype,
    method: 'toISOString',
    passthrough: true,
  });
  dateSpy.calledWith([]).returns('2024-01-01T00:00:00.000Z');

  return {
    stagesHealth: ({ uptime, version }: { uptime: number; version: string }): void => {
      healthProxy.stagesHealth({ uptime, version });
    },
    captureClient: relayProxy.captureClient,
    getCapturedMessages: relayProxy.getCapturedMessages,
  };
};
