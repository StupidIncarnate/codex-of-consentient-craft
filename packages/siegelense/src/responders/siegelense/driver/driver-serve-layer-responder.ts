/**
 * PURPOSE: Owns a booted lane's SERVING half — the heartbeat ticker, the socket's request loop, the
 * OS signal handlers, and the idle-or-kill wait — and returns once the lane is torn down, by
 * whichever path got there first. Lives at the responder layer, not in `flows/` or `startup/`,
 * because it reads and writes `driverSessionState` (only `bindings/`, `responders/` and `widgets/`
 * may import `state/`) and calls brokers directly (`flows/` and `startup/` cannot import `brokers/`
 * at all — see `get-architecture`'s layer table). The heartbeat TICKER's `setInterval` callback
 * reports a failing tick to stderr and keeps ticking rather than letting the interval die:
 * `heartbeatWriteBroker` throws by design, and a ticker that let one bad tick kill the loop would
 * take down the ONLY recorded defence against a SIGKILLed driver with it. SIGINT/SIGTERM are
 * installed here for the identical reason the state import is here — a signal handler that tears the
 * lane down needs the live lane and the kill-signal resolver this closure holds.
 *
 * USAGE:
 * await DriverServeLayerResponder({ instanceId, guildId: null, lane });
 * // Resolves once the idle deadline passes or a `kill` (socket or OS signal) tears the lane down
 */

import { adapterResultContract } from '@dungeonmaster/shared/contracts';
import type { AdapterResult, GuildId } from '@dungeonmaster/shared/contracts';

import { netUnixServeAdapter } from '../../../adapters/net/unix-serve/net-unix-serve-adapter';
import { driverHandleRequestBroker } from '../../../brokers/driver/handle-request/driver-handle-request-broker';
import { driverHeartbeatTickBroker } from '../../../brokers/driver/heartbeat-tick/driver-heartbeat-tick-broker';
import { instanceReleaseBroker } from '../../../brokers/instance/release/instance-release-broker';
import { laneTeardownBroker } from '../../../brokers/lane/teardown/lane-teardown-broker';
import { locationsSocketPathFindBroker } from '../../../brokers/locations/socket-path-find/locations-socket-path-find-broker';
import { driverResponseContract } from '../../../contracts/driver-response/driver-response-contract';
import type { InstanceId } from '../../../contracts/instance-id/instance-id-contract';
import type { LaneSession } from '../../../contracts/lane-session/lane-session-contract';
import { driverSessionState } from '../../../state/driver-session/driver-session-state';
import { driverStatics } from '../../../statics/driver/driver-statics';
import { instanceLifecycleStatics } from '../../../statics/instance-lifecycle/instance-lifecycle-statics';
import { DriverIdleWaitLayerResponder } from './driver-idle-wait-layer-responder';

export const DriverServeLayerResponder = async ({
  instanceId,
  guildId,
  lane,
}: {
  instanceId: InstanceId;
  guildId: GuildId | null;
  lane: LaneSession;
}): Promise<AdapterResult> => {
  driverSessionState.set({ lane });

  let resolveKillSignal: ((killed: true) => void) | null = null;
  const killSignal = new Promise<true>((resolve) => {
    resolveKillSignal = resolve;
  });

  driverStatics.teardown.signals.forEach((signal) => {
    process.on(signal, () => {
      (async (): Promise<void> => {
        const currentLane = driverSessionState.lane();
        if (currentLane === null) {
          resolveKillSignal?.(true);
          return;
        }
        try {
          await laneTeardownBroker({ session: currentLane, instanceId });
          await instanceReleaseBroker({ instanceId });
        } catch (error) {
          process.stderr.write(
            `[driver-serve] signal teardown failed for ${instanceId}: ${String(error)}\n`,
          );
        }
        driverSessionState.clear();
        resolveKillSignal?.(true);
      })().catch((error: unknown) => {
        process.stderr.write(
          `[driver-serve] unexpected signal-handler failure for ${instanceId}: ${String(error)}\n`,
        );
      });
    });
  });

  const heartbeatTimer = setInterval(() => {
    const currentLane = driverSessionState.lane();
    if (currentLane === null) {
      return;
    }
    driverHeartbeatTickBroker({ instanceId, guildId, lane: currentLane }).catch(
      (error: unknown) => {
        process.stderr.write(
          `[driver-serve] heartbeat tick failed for ${instanceId}: ${String(error)}\n`,
        );
      },
    );
  }, instanceLifecycleStatics.heartbeat.intervalMs);

  const socketPath = locationsSocketPathFindBroker({ instanceId });

  await netUnixServeAdapter({
    socketPath,
    onRequest: async ({ request }) => {
      driverSessionState.touch();
      const currentLane = driverSessionState.lane();

      if (currentLane === null) {
        return driverResponseContract.parse({
          ok: false,
          payload: '',
          error: `Instance ${instanceId} has no active lane`,
        });
      }

      const response = await driverHandleRequestBroker({
        request,
        instanceId,
        lane: currentLane,
        mintRunId: driverSessionState.nextRunId,
      });

      if (request.kind === 'kill' && response.ok) {
        driverSessionState.clear();
        resolveKillSignal?.(true);
      }

      return response;
    },
  });

  const wasKilled = await DriverIdleWaitLayerResponder({ killSignal });

  clearInterval(heartbeatTimer);

  if (!wasKilled) {
    const finalLane = driverSessionState.lane();
    if (finalLane !== null) {
      await laneTeardownBroker({ session: finalLane, instanceId });
      await instanceReleaseBroker({ instanceId });
      driverSessionState.clear();
    }
  }

  return adapterResultContract.parse({ success: true });
};
