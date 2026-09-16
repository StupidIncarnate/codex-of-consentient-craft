/**
 * PURPOSE: Owns a booted lane's SERVING half — the first heartbeat beat, the heartbeat ticker, the
 * socket's request loop, the OS signal handlers, and the idle-or-kill wait — and returns once the
 * lane is torn down, by whichever path got there first. Lives at the responder layer, not in
 * `flows/` or `startup/`, because it reads and writes `driverSessionState` (only `bindings/`,
 * `responders/` and `widgets/` may import `state/`) and calls brokers directly (`flows/` and
 * `startup/` cannot import `brokers/` at all — see `get-architecture`'s layer table). The FIRST beat
 * runs CONCURRENTLY with standing up the socket (`Promise.all`, not a sequential `await` before it):
 * this function does not move on to `DriverIdleWaitLayerResponder` until BOTH have landed, so a
 * driver SIGKILLed anytime after that point still has a `heartbeat.json` on disk — the ticker's own
 * first tick otherwise does not fire until `instanceLifecycleStatics.heartbeat.intervalMs` later, and
 * `instanceKillBroker`'s orphan-reap path reads that file to know which process groups to signal. The
 * heartbeat TICKER's `setInterval` callback reports a failing tick to stderr and keeps ticking rather
 * than letting the interval die, and the first beat above is caught the identical way rather than
 * left to crash the boot: `heartbeatWriteBroker` throws by design, and a ticker (or a first beat)
 * that let one bad write kill the loop would take down the ONLY recorded defence against a SIGKILLed
 * driver with it. SIGINT/SIGTERM are installed here for the identical reason the state import is
 * here — a signal handler that tears the lane down needs the live lane and the kill-signal resolver
 * this closure holds. Closes the socket server, via the `close` `netUnixServeAdapter` hands back,
 * as the LAST step on every path out — the listening handle is what keeps this OS process's event
 * loop alive, and this package never calls `process.exit()` on a success path, so a driver that
 * never closes its own socket never exits, killed OR idled out. Placed after every teardown step
 * intentionally: a `kill` response is already written to its own still-open connection by the time
 * this line runs, and `close()` cannot un-write it — it only refuses connections that have not
 * arrived yet.
 *
 * USAGE:
 * await DriverServeLayerResponder({ instanceId, guildId: null, lane });
 * // Resolves once the idle deadline passes or a `kill` (socket or OS signal) tears the lane down,
 * // and the socket server is closed — the driver's own OS process can now exit
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

  // First beat, started here but AWAITED alongside the socket below — see this file's own header
  // for why a driver must never be pingable before at least one beat has landed. `lane` (not a
  // `driverSessionState.lane()` re-read) is correct here: nothing has had a chance to clear the
  // state between the `set` above and this line. Run CONCURRENTLY with `netUnixServeAdapter`,
  // never sequenced before it: `netUnixServeAdapter` must still be INVOKED synchronously, in the
  // same tick as everything above, so its `createServer` call (which happens synchronously inside
  // the Promise it returns) registers the connection handler before this function's first `await`
  // — a real client can only reach the socket once the event loop turns anyway, by which point
  // both promises below have settled.
  const firstBeat = driverHeartbeatTickBroker({ instanceId, guildId, lane }).catch(
    (error: unknown) => {
      process.stderr.write(
        `[driver-serve] heartbeat tick failed for ${instanceId}: ${String(error)}\n`,
      );
    },
  );

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

  const [, serveResult] = await Promise.all([
    firstBeat,
    netUnixServeAdapter({
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
          flushCursor: driverSessionState.flushCursor,
          advanceFlushCursor: driverSessionState.advanceFlushCursor,
          lastShotPath: driverSessionState.lastShotPath,
          setLastShotPath: driverSessionState.setLastShotPath,
        });

        if (request.kind === 'kill' && response.ok) {
          driverSessionState.clear();
          resolveKillSignal?.(true);
        }

        return response;
      },
    }),
  ]);

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

  // Last step on every path out — see this file's own header for why closing here.
  await serveResult.close();

  return adapterResultContract.parse({ success: true });
};
