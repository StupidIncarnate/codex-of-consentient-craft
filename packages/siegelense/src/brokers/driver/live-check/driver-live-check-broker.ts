/**
 * PURPOSE: Answers whether a registry row's DRIVER is a live, running process, distinct from the
 * row's own `state` field — a reservation is `state: 'alive'` long before any driver exists (DEF-89:
 * `SiegelenseFlow`'s `driver` route and the spawn `instanceStartBroker` launches both converge on
 * `SiegelenseDriverResponder`, so nothing at the entry point tells a legitimate boot apart from a
 * hand-typed `driver --instance <id>` racing an already-running one — only the registry row can).
 * `entry.pid` is checked with `processIsAliveBroker` rather than a dedicated pid probe: the driver
 * is spawned via `childProcessSpawnDetachedAdapter` with `detached: true` (see
 * `instanceStartBroker`), which makes it its own process-GROUP LEADER, so its pid and its pgid are
 * the same number and the existing `process.kill(-pgid, 0)` probe applies unchanged. A pid equal to
 * THIS process's own (`process.pid`) is never treated as live — a dead driver's pid can be recycled
 * by the OS to the very process now trying to boot that same instance, and refusing a spawn because
 * it collided with its own reused pid would be a false hijack report, not a caught one. The socket
 * ping is the fallback, not the primary check: `processIsAliveBroker` costs one syscall and no
 * timeout, while `netUnixRequestAdapter` needs a live socket file and a round trip, so it only runs
 * once the pid check alone could not already prove the driver live.
 *
 * USAGE:
 * await driverLiveCheckBroker({ entry: RegistryEntryStub({ pid: null }) });
 * // Returns false — a fresh reservation, no driver has booted yet
 *
 * await driverLiveCheckBroker({ entry: RegistryEntryStub({ pid: ProcessIdStub({ value: '108019' }) }) });
 * // Returns true when pid 108019 answers process.kill(pid, 0), or its socket answers ping
 */

import { contentTextContract, processIdContract } from '@dungeonmaster/shared/contracts';

import { netUnixRequestAdapter } from '../../../adapters/net/unix-request/net-unix-request-adapter';
import { processIsAliveBroker } from '../../process/is-alive/process-is-alive-broker';
import { driverRequestContract } from '../../../contracts/driver-request/driver-request-contract';
import { processGroupIdContract } from '../../../contracts/process-group-id/process-group-id-contract';
import type { RegistryEntry } from '../../../contracts/registry-entry/registry-entry-contract';
import { driverStatics } from '../../../statics/driver/driver-statics';

export const driverLiveCheckBroker = async ({
  entry,
}: {
  entry: RegistryEntry;
}): Promise<boolean> => {
  if (entry.pid === null || entry.pid === processIdContract.parse(String(process.pid))) {
    return false;
  }

  if (processIsAliveBroker({ pgid: processGroupIdContract.parse(Number(entry.pid)) })) {
    return true;
  }

  if (entry.socketPath === null) {
    return false;
  }

  return netUnixRequestAdapter({
    socketPath: entry.socketPath,
    request: driverRequestContract.parse({ kind: 'ping', payload: contentTextContract.parse('') }),
    timeoutMs: driverStatics.socket.requestTimeoutMs,
  })
    .then(() => true)
    .catch(() => false);
};
