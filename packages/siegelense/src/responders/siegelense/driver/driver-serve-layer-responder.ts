/**
 * PURPOSE: Owns a booted lane's SERVING half — the first heartbeat beat, the heartbeat ticker, the
 * socket's request loop, the OS signal handlers, and the idle-or-kill wait — and returns once the
 * lane is torn down, by whichever path got there first. Lives at the responder layer, not in
 * `flows/` or `startup/`, because it reads and writes `driverSessionState` (only `bindings/`,
 * `responders/` and `widgets/` may import `state/`) and calls brokers directly (`flows/` and
 * `startup/` cannot import `brokers/` at all — see `get-architecture`'s layer table). The socket
 * still opens CONCURRENTLY with the first beat — `netUnixServeAdapter` is invoked synchronously,
 * unblocked by `firstBeat`, so a unix-socket bind (a direct, near-instant OS call) is never held
 * up by `heartbeatWriteBroker` -> `machineRssByPgidBroker`'s whole-`/proc` walk, which is
 * threadpool-bound and stretches under load (measured: ~1ms to bind versus ~50-300ms for that walk
 * once the machine carries hundreds of processes — see that broker's own header on scheduler
 * contention). What is NOT concurrent is ANSWERING: `onRequest` below `await firstBeat`s
 * immediately before it returns its response, on every branch, so `netUnixServeAdapter` never
 * writes a reply frame back to a real client until `heartbeat.json` is already on disk — a client
 * can be CONNECTED to an unanswered socket the instant it is bound, but it cannot observe a
 * successful `ping` (or any other response) any earlier than that. Gating the reply rather than the
 * bind is deliberate: gating the bind instead would have delayed `netUnixServeAdapter`'s own
 * invocation behind `firstBeat`, moving `driverSessionState`'s reads inside `onRequest` behind an
 * await too and reopening a race against this same file's mocked, near-instant idle-wait-then-
 * teardown path — gating only the OUTGOING reply keeps every state read exactly where it was,
 * synchronous with the request arriving. The heartbeat TICKER's `setInterval`
 * callback reports a failing tick to stderr and keeps ticking rather
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
 * arrived yet. On the IDLE path (never on a `kill`), `shutdownReasonWriteBroker` writes
 * `shutdown-reason.json` beside the instance's evidence BEFORE `laneTeardownBroker` runs — a
 * deliberate self-reap the tool scheduled, not a memory-pressure death, and `status`'s
 * `likelyCauseLayerBroker` reads that recorded reason back instead of inventing an RSS/OOM narrative
 * for a death nobody forced (siegelense-tooling.md's "the crash a walker must NOT mistake for a
 * defect"). A `kill` needs no such marker: the CALLER already knows why the lane stopped.
 *
 * USAGE:
 * await DriverServeLayerResponder({ instanceId, guildId: null, lane });
 * // Resolves once the idle deadline passes or a `kill` (socket or OS signal) tears the lane down,
 * // and the socket server is closed — the driver's own OS process can now exit
 *
 * await DriverServeLayerResponder({ instanceId, guildId: null, lane, idleTimeoutMs: TimeoutMsStub({ value: 1_800_000 }) });
 * // Same, but reaps itself after 1_800_000ms of no traffic instead of driverStatics.idle.timeoutMs
 */

import { adapterResultContract, contentTextContract } from '@dungeonmaster/shared/contracts';
import type { AdapterResult, GuildId, TimeoutMs } from '@dungeonmaster/shared/contracts';

import { netUnixServeAdapter } from '../../../adapters/net/unix-serve/net-unix-serve-adapter';
import { driverHandleRequestBroker } from '../../../brokers/driver/handle-request/driver-handle-request-broker';
import { driverHeartbeatTickBroker } from '../../../brokers/driver/heartbeat-tick/driver-heartbeat-tick-broker';
import { instanceReleaseBroker } from '../../../brokers/instance/release/instance-release-broker';
import { laneTeardownBroker } from '../../../brokers/lane/teardown/lane-teardown-broker';
import { locationsInstanceEvidencePathFindBroker } from '../../../brokers/locations/instance-evidence-path-find/locations-instance-evidence-path-find-broker';
import { locationsSocketPathFindBroker } from '../../../brokers/locations/socket-path-find/locations-socket-path-find-broker';
import { shutdownReasonWriteBroker } from '../../../brokers/shutdown-reason/write/shutdown-reason-write-broker';
import { driverResponseContract } from '../../../contracts/driver-response/driver-response-contract';
import type { InstanceId } from '../../../contracts/instance-id/instance-id-contract';
import type { LaneSession } from '../../../contracts/lane-session/lane-session-contract';
import { driverSessionState } from '../../../state/driver-session/driver-session-state';
import { driverStatics } from '../../../statics/driver/driver-statics';
import { instanceLifecycleStatics } from '../../../statics/instance-lifecycle/instance-lifecycle-statics';
import { DriverIdleWaitLayerResponder } from './driver-idle-wait-layer-responder';

const MS_PER_SECOND = 1_000;

export const DriverServeLayerResponder = async ({
  instanceId,
  guildId,
  lane,
  idleTimeoutMs,
}: {
  instanceId: InstanceId;
  guildId: GuildId | null;
  lane: LaneSession;
  idleTimeoutMs?: TimeoutMs;
}): Promise<AdapterResult> => {
  driverSessionState.set(idleTimeoutMs === undefined ? { lane } : { lane, idleTimeoutMs });

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

  // First beat, started here and referenced inside `onRequest` below — see this file's own header
  // for why a driver must never ANSWER before at least one beat has landed. `lane` (not a
  // `driverSessionState.lane()` re-read) is correct here: nothing has had a chance to clear the
  // state between the `set` above and this line.
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

  const serveResult = await netUnixServeAdapter({
    socketPath,
    onRequest: async ({ request }) => {
      driverSessionState.touch();
      const currentLane = driverSessionState.lane();

      if (currentLane === null) {
        await firstBeat;
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

      // Gates the OUTGOING reply, never the state reads above — see this file's own header.
      await firstBeat;

      return response;
    },
  });

  const wasKilled = await DriverIdleWaitLayerResponder({ killSignal });

  clearInterval(heartbeatTimer);

  if (!wasKilled) {
    const finalLane = driverSessionState.lane();
    if (finalLane !== null) {
      // Written BEFORE teardown, so the fact survives this process exiting with it — a deliberate
      // self-reap, never a memory-pressure death (see this file's own header). Wrapped so a marker
      // write failure (a disk full, an unwritable evidence dir) can never block the teardown this
      // lane is already committed to.
      try {
        await shutdownReasonWriteBroker({
          evidencePath: locationsInstanceEvidencePathFindBroker({ instanceId, guildId }),
          reason: contentTextContract.parse(
            `reaped by idle timeout after ${String(driverSessionState.idleTimeoutMs() / MS_PER_SECOND)}s with no run received`,
          ),
        });
      } catch (markerWriteError: unknown) {
        process.stderr.write(
          `[driver-serve] writing the shutdown-reason marker for ${instanceId} failed: ${String(markerWriteError)}\n`,
        );
      }

      await laneTeardownBroker({ session: finalLane, instanceId });
      await instanceReleaseBroker({ instanceId });
      driverSessionState.clear();
    }
  }

  // Last step on every path out — see this file's own header for why closing here.
  await serveResult.close();

  return adapterResultContract.parse({ success: true });
};
