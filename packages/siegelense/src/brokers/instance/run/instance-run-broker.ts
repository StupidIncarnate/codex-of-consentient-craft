/**
 * PURPOSE: The thin client half of `run` — reads the registry row for the instance's socket
 * (falling back to the deterministic socket path when the row carries none, so a caller pointed
 * at an instance the registry never recorded still gets a real connection attempt rather than a
 * silent no-op), sends one `run` request down the socket, and parses the driver's response back
 * into a `RunResult`. A bare connection error cannot tell a crash from a kill from an instance
 * that never existed (spec lines 245-252), so any failure `netUnixRequestAdapter` throws is
 * wrapped in `DriverUnreachableError` naming this instance before it reaches the caller.
 *
 * A row already read `unusable` is refused before the socket is ever touched —
 * `InstanceUnusableError` names the instance and points at a fresh `start`, so a walk that keeps
 * calling `run` against an instance an earlier batch already poisoned pays no round trip to learn
 * it should stop. This is also the ONLY place that WRITES `unusable`: once the driver answers, a
 * `RunResult` whose batch stopped on a `seed` step (`stoppedAt.verb === 'seed'`) means the recipe's
 * own plan failed partway through — some rows landed, some did not, and there is nothing to roll
 * back to (scrolls/seigelense/siegelense-recipes.md: "A mid-batch seed that fails HALTS the batch
 * and marks the instance unusable"). The mark only flips `state`; it leaves `pid`/`pgids`/
 * `socketPath` alone, unlike `instanceReleaseBroker`'s `killed` mark — the driver is still alive and
 * reads (`results`, `status`, `snapshots`) still need it.
 *
 * USAGE:
 * await instanceRunBroker({ instanceId, steps: [StepStub()], stopOn: StopOnStub() });
 * // Returns the RunResult the driver reports, or throws DriverUnreachableError naming instanceId,
 * // or throws InstanceUnusableError when the registry already marked this instance unusable
 */

import { contentTextContract } from '@dungeonmaster/shared/contracts';

import { netUnixRequestAdapter } from '../../../adapters/net/unix-request/net-unix-request-adapter';
import { driverRequestContract } from '../../../contracts/driver-request/driver-request-contract';
import type { InstanceId } from '../../../contracts/instance-id/instance-id-contract';
import { registryEntryContract } from '../../../contracts/registry-entry/registry-entry-contract';
import { runRequestContract } from '../../../contracts/run-request/run-request-contract';
import { runResultContract } from '../../../contracts/run-result/run-result-contract';
import type { RunResult } from '../../../contracts/run-result/run-result-contract';
import type { Step } from '../../../contracts/step/step-contract';
import type { StopOn } from '../../../contracts/stop-on/stop-on-contract';
import { DriverUnreachableError } from '../../../errors/driver-unreachable/driver-unreachable-error';
import { InstanceUnusableError } from '../../../errors/instance-unusable/instance-unusable-error';
import { locationsSocketPathFindBroker } from '../../locations/socket-path-find/locations-socket-path-find-broker';
import { registryReadBroker } from '../../registry/read/registry-read-broker';
import { registryUpdateBroker } from '../../registry/update/registry-update-broker';
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

  if (entry?.state === 'unusable') {
    throw new InstanceUnusableError({ instanceId });
  }

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

  const result = runResultContract.parse(JSON.parse(response.payload));

  if (result.stoppedAt !== null && result.stoppedAt.verb === 'seed') {
    await registryUpdateBroker({
      mutate: (current) => ({
        instances: current.instances.map((candidate) =>
          candidate.id === instanceId
            ? registryEntryContract.parse({ ...candidate, state: 'unusable' })
            : candidate,
        ),
      }),
    });
  }

  return result;
};
