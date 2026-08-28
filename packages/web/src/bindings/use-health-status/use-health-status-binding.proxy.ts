import type { HealthStatusPayloadStub } from '@dungeonmaster/shared/contracts';
import { registerSpyOn } from '@dungeonmaster/testing/register-mock';

import { healthStatusGetBrokerProxy } from '../../brokers/health-status/get/health-status-get-broker.proxy';
import { webSocketChannelStateProxy } from '../../state/web-socket-channel/web-socket-channel-state.proxy';

type HealthStatusPayload = ReturnType<typeof HealthStatusPayloadStub>;

// The binding stamps every delivered heartbeat with `new Date().toISOString()`, so the arrival
// instant is the one non-deterministic input a test cannot otherwise pin exactly. Staged with a
// catch-all because toISOString takes no arguments — there is no address to discriminate on.
// installSilenceClock seeds a fake clock at this SAME instant, so a silence-boundary test's
// `now - lastHeartbeatAt` starts at exactly zero rather than at today's real date.
const HEARTBEAT_DELIVERED_AT = '2026-07-28T10:00:00.000Z';

export const useHealthStatusBindingProxy = (): ReturnType<typeof healthStatusGetBrokerProxy> & {
  setupConnectedChannel: () => void;
  deliverHeartbeat: (params: { payload: HealthStatusPayload }) => void;
  triggerClose: () => void;
  triggerReconnect: () => void;
  installSilenceClock: () => void;
  restoreRealClock: () => void;
  hadNoConsoleErrors: () => boolean;
} => {
  const broker = healthStatusGetBrokerProxy();
  const channel = webSocketChannelStateProxy();
  const isoHandle = registerSpyOn({ object: Date.prototype, method: 'toISOString' });
  isoHandle.calledWith([]).returns(HEARTBEAT_DELIVERED_AT);
  // useHealthStatusBinding logs directly from its retry/seed catch (no error state surfaced), so
  // any test composing this binding without staging a seed response would otherwise throw here.
  // passthrough: true — console.error is a shared sink; React's own internal warnings (e.g. act()
  // warnings) also flow through it and must keep printing normally, not throw for being unstaged.
  const consoleErrorHandle = registerSpyOn({
    object: globalThis.console,
    method: 'error',
    passthrough: true,
  });
  consoleErrorHandle.calledWith(['[use-health-status]']).returns(undefined);

  return {
    ...broker,
    setupConnectedChannel: (): void => {
      channel.setupEmpty();
      channel.connect();
      channel.triggerOpen();
    },
    deliverHeartbeat: ({ payload }: { payload: HealthStatusPayload }): void => {
      channel.deliverMessage({
        data: JSON.stringify({
          type: 'health-status',
          payload,
          timestamp: HEARTBEAT_DELIVERED_AT,
        }),
      });
    },
    triggerClose: (): void => {
      channel.triggerClose();
    },
    triggerReconnect: (): void => {
      channel.triggerReconnect();
    },
    // Seeds the fake clock at the exact instant deliverHeartbeat stamps, so a boundary test's
    // Date.now() reads elapsed-since-heartbeat starting from zero rather than from install time.
    installSilenceClock: (): void => {
      jest.useFakeTimers({ now: new Date(HEARTBEAT_DELIVERED_AT).getTime() });
    },
    restoreRealClock: (): void => {
      jest.useRealTimers();
    },
    hadNoConsoleErrors: (): boolean => consoleErrorHandle.callsMatching([]).length === 0,
  };
};
