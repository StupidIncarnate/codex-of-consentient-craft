/**
 * PURPOSE: Polls a freshly-spawned driver's socket with `ping` until it answers, a
 * `boot-failure.json` marker appears beside its evidence, or `deadlineMs` passes — recursion with an
 * early return, never `while (true)`, mirroring `laneReadyWaitBroker`'s shape. A slow boot and a
 * driver that already died must read differently (spec line 1473): a failed connect attempt alone is
 * "not up yet" and gets retried, but the SAME failed attempt paired with a failure marker means the
 * driver caught its own error and exited before this poll's deadline ever mattered — checked on every
 * failed ping rather than only once up front, since the marker can land on any retry. Only running
 * out of deadline with no marker present reports `'timeout'`; `instanceStartBroker` turns a `'failed'`
 * outcome into `DriverBootFailedError` (carrying the driver's own message) and a `'timeout'` outcome
 * into `LaneBootFailedError` (naming whichever processes are still unreachable).
 *
 * USAGE:
 * await instanceStartBootPollLayerBroker({
 *   socketPath: AbsoluteFilePathStub({ value: '/tmp/dm-siege-sockets/inst_1.sock' }),
 *   deadlineMs: EpochMsStub({ value: Date.now() + 180_000 }),
 *   evidencePath: AbsoluteFilePathStub({ value: '/repo/.dungeonmaster-assets/siegelense-assets/unowned/instances/inst_1' }),
 * });
 * // Resolves { status: 'ready' } once the driver answers `ping`
 * // Resolves { status: 'failed', message } the moment a failure marker appears
 * // Resolves { status: 'timeout' } once deadlineMs passes with no answer and no marker
 */

import { netUnixRequestAdapter } from '../../../adapters/net/unix-request/net-unix-request-adapter';
import { bootFailureMarkerReadBroker } from '../../boot-failure-marker/read/boot-failure-marker-read-broker';
import { bootPollOutcomeContract } from '../../../contracts/boot-poll-outcome/boot-poll-outcome-contract';
import type { BootPollOutcome } from '../../../contracts/boot-poll-outcome/boot-poll-outcome-contract';
import { driverRequestContract } from '../../../contracts/driver-request/driver-request-contract';
import type { EpochMs } from '../../../contracts/epoch-ms/epoch-ms-contract';
import { driverStatics } from '../../../statics/driver/driver-statics';
import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';
import { contentTextContract } from '@dungeonmaster/shared/contracts';

export const instanceStartBootPollLayerBroker = async ({
  socketPath,
  deadlineMs,
  evidencePath,
}: {
  socketPath: AbsoluteFilePath;
  deadlineMs: EpochMs;
  evidencePath: AbsoluteFilePath;
}): Promise<BootPollOutcome> => {
  try {
    const response = await netUnixRequestAdapter({
      socketPath,
      request: driverRequestContract.parse({
        kind: 'ping',
        payload: contentTextContract.parse(''),
      }),
      timeoutMs: driverStatics.socket.connectTimeoutMs,
    });

    return bootPollOutcomeContract.parse({ status: response.ok ? 'ready' : 'timeout' });
  } catch (_pingError) {
    const failureMarker = await bootFailureMarkerReadBroker({ evidencePath });
    if (failureMarker !== null) {
      return bootPollOutcomeContract.parse({ status: 'failed', message: failureMarker.message });
    }

    if (Date.now() >= deadlineMs) {
      return bootPollOutcomeContract.parse({ status: 'timeout' });
    }

    await new Promise<void>((resolve) => {
      setTimeout(resolve, driverStatics.boot.readyPollMs);
    });

    return instanceStartBootPollLayerBroker({ socketPath, deadlineMs, evidencePath });
  }
};
