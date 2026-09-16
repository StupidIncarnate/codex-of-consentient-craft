/**
 * PURPOSE: Polls a freshly-spawned driver's socket with `ping` until it answers or `deadlineMs`
 * passes — recursion with an early return, never `while (true)`, mirroring
 * `laneReadyWaitBroker`'s shape. A slow boot and an unreachable driver must read differently
 * (spec line 1473), so a failed connect attempt is treated as "not up yet" and retried rather than
 * thrown; only running out of deadline reports `false`, which `instanceStartBroker` turns into
 * `LaneBootFailedError`.
 *
 * USAGE:
 * await instanceStartBootPollLayerBroker({
 *   socketPath: AbsoluteFilePathStub({ value: '/tmp/dm-siege-sockets/inst_1.sock' }),
 *   deadlineMs: EpochMsStub({ value: Date.now() + 180_000 }),
 * });
 * // Resolves true once the driver answers `ping`, or false once deadlineMs passes with no answer
 */

import { netUnixRequestAdapter } from '../../../adapters/net/unix-request/net-unix-request-adapter';
import { driverRequestContract } from '../../../contracts/driver-request/driver-request-contract';
import type { EpochMs } from '../../../contracts/epoch-ms/epoch-ms-contract';
import { driverStatics } from '../../../statics/driver/driver-statics';
import type { AbsoluteFilePath } from '@dungeonmaster/shared/contracts';
import { contentTextContract } from '@dungeonmaster/shared/contracts';

export const instanceStartBootPollLayerBroker = async ({
  socketPath,
  deadlineMs,
}: {
  socketPath: AbsoluteFilePath;
  deadlineMs: EpochMs;
}): Promise<boolean> => {
  try {
    const response = await netUnixRequestAdapter({
      socketPath,
      request: driverRequestContract.parse({
        kind: 'ping',
        payload: contentTextContract.parse(''),
      }),
      timeoutMs: driverStatics.socket.connectTimeoutMs,
    });

    return response.ok;
  } catch (_pingError) {
    if (Date.now() >= deadlineMs) {
      return false;
    }

    await new Promise<void>((resolve) => {
      setTimeout(resolve, driverStatics.boot.readyPollMs);
    });

    return instanceStartBootPollLayerBroker({ socketPath, deadlineMs });
  }
};
