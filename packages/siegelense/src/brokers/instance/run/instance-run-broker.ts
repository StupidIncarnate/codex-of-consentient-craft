/**
 * PURPOSE: The thin client half of `run` — reads the registry row for the instance's socket
 * (falling back to the deterministic socket path when the row carries none, so a caller pointed
 * at an instance the registry never recorded still gets a real connection attempt rather than a
 * silent no-op), sends one `run` request down the socket, and parses the driver's response back
 * into a `RunResult`. A bare connection error cannot tell a crash from a kill from an instance
 * that never existed (spec lines 245-252), so any failure `netUnixRequestAdapter` throws is
 * wrapped in `DriverUnreachableError` naming this instance before it reaches the caller.
 *
 * USAGE:
 * await instanceRunBroker({ instanceId, steps: [StepStub()], stopOn: StopOnStub() });
 * // Returns the RunResult the driver reports, or throws DriverUnreachableError naming instanceId
 */

import { contentTextContract } from '@dungeonmaster/shared/contracts';

import { netUnixRequestAdapter } from '../../../adapters/net/unix-request/net-unix-request-adapter';
import { driverRequestContract } from '../../../contracts/driver-request/driver-request-contract';
import type { InstanceId } from '../../../contracts/instance-id/instance-id-contract';
import { runRequestContract } from '../../../contracts/run-request/run-request-contract';
import { runResultContract } from '../../../contracts/run-result/run-result-contract';
import type { RunResult } from '../../../contracts/run-result/run-result-contract';
import type { Step } from '../../../contracts/step/step-contract';
import type { StopOn } from '../../../contracts/stop-on/stop-on-contract';
import { DriverUnreachableError } from '../../../errors/driver-unreachable/driver-unreachable-error';
import { locationsSocketPathFindBroker } from '../../locations/socket-path-find/locations-socket-path-find-broker';
import { registryReadBroker } from '../../registry/read/registry-read-broker';
import { driverStatics } from '../../../statics/driver/driver-statics';

export const instanceRunBroker = async ({
  instanceId,
  steps,
  stopOn,
}: {
  instanceId: InstanceId;
  steps: readonly Step[];
  stopOn: StopOn;
}): Promise<RunResult> => {
  const registry = await registryReadBroker();
  const entry = registry.instances.find((candidate) => candidate.id === instanceId);
  const socketPath = entry?.socketPath ?? locationsSocketPathFindBroker({ instanceId });

  const request = driverRequestContract.parse({
    kind: 'run',
    payload: contentTextContract.parse(
      JSON.stringify(runRequestContract.parse({ instanceId, steps, stopOn })),
    ),
  });

  const response = await netUnixRequestAdapter({
    socketPath,
    request,
    timeoutMs: driverStatics.socket.requestTimeoutMs,
  }).catch((connectError: unknown) => {
    throw new DriverUnreachableError({ instanceId, socketPath, cause: connectError });
  });

  if (!response.ok) {
    throw new Error(
      `instanceRunBroker: driver for instance ${instanceId} reported a failure: ${response.error ?? 'no error message'}`,
    );
  }

  return runResultContract.parse(JSON.parse(response.payload));
};
