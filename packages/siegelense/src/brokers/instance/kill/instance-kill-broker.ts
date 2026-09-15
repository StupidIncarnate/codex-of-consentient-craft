/**
 * PURPOSE: The thin client half of `kill` — sends `kill` down the instance's socket and reports
 * what the driver did, or, when the socket refuses (a SIGKILLed driver — spec line 1122), falls
 * back to the ORPHAN REAP path: read the heartbeat file's recorded pgids, SIGTERM-then-SIGKILL
 * each process group, remove the throwaway home, and mark the registry row killed. Either path
 * removes ONLY the throwaway home and never the evidence directory (packages/siegelense/CLAUDE.md
 * — logs, captures and the transcript are evidence and outlive the instance), and either path
 * accepts an already-dead instance's id, since that is how a session reaps an orphan it can see in
 * `status` (spec line 1172).
 *
 * USAGE:
 * await instanceKillBroker({ instanceId });
 * // Driver reachable: sends `kill`, returns { stopped: true, reapedPgids: [], ... }
 * // Driver unreachable: reaps the heartbeat's pgids, returns { stopped: true, reapedPgids: [...] }
 */

import { pathJoinAdapter } from '@dungeonmaster/shared/adapters';
import { absoluteFilePathContract, contentTextContract } from '@dungeonmaster/shared/contracts';
import { locationsStatics } from '@dungeonmaster/shared/statics';

import { errorIsNativeErrorAdapter } from '../../../adapters/error/is-native-error/error-is-native-error-adapter';
import { fsReadFileAdapter } from '../../../adapters/fs/read-file/fs-read-file-adapter';
import { fsRmAdapter } from '../../../adapters/fs/rm/fs-rm-adapter';
import { netUnixRequestAdapter } from '../../../adapters/net/unix-request/net-unix-request-adapter';
import { osTmpdirAdapter } from '../../../adapters/os/tmpdir/os-tmpdir-adapter';
import { processIsAliveAdapter } from '../../../adapters/process/is-alive/process-is-alive-adapter';
import { processKillGroupAdapter } from '../../../adapters/process/kill-group/process-kill-group-adapter';
import { driverRequestContract } from '../../../contracts/driver-request/driver-request-contract';
import { instanceHeartbeatContract } from '../../../contracts/instance-heartbeat/instance-heartbeat-contract';
import type { InstanceId } from '../../../contracts/instance-id/instance-id-contract';
import { killResultContract } from '../../../contracts/kill-result/kill-result-contract';
import type { KillResult } from '../../../contracts/kill-result/kill-result-contract';
import { instanceReleaseBroker } from '../release/instance-release-broker';
import { locationsInstanceEvidencePathFindBroker } from '../../locations/instance-evidence-path-find/locations-instance-evidence-path-find-broker';
import { locationsRepoLinkPathFindBroker } from '../../locations/repo-link-path-find/locations-repo-link-path-find-broker';
import { locationsSocketPathFindBroker } from '../../locations/socket-path-find/locations-socket-path-find-broker';
import { registryReadBroker } from '../../registry/read/registry-read-broker';
import { driverStatics } from '../../../statics/driver/driver-statics';

export const instanceKillBroker = async ({
  instanceId,
}: {
  instanceId: InstanceId;
}): Promise<KillResult> => {
  const registry = await registryReadBroker();
  const entry = registry.instances.find((candidate) => candidate.id === instanceId);
  const guildId = entry?.guildId ?? null;
  const portsReleased = entry === undefined ? [] : [entry.ports.api, entry.ports.web];
  const socketPath = entry?.socketPath ?? locationsSocketPathFindBroker({ instanceId });

  const evidencePath = locationsInstanceEvidencePathFindBroker({ instanceId, guildId });
  const evidenceKept = await locationsRepoLinkPathFindBroker({ homePath: evidencePath });

  const request = driverRequestContract.parse({
    kind: 'kill',
    payload: contentTextContract.parse(''),
  });

  return netUnixRequestAdapter({
    socketPath,
    request,
    timeoutMs: driverStatics.socket.requestTimeoutMs,
  })
    .then(
      (): KillResult =>
        killResultContract.parse({
          instanceId,
          stopped: true,
          portsReleased,
          homeRemoved: true,
          evidenceKept,
          reapedPgids: [],
        }),
    )
    .catch(async (): Promise<KillResult> => {
      const heartbeatPath = absoluteFilePathContract.parse(
        pathJoinAdapter({ paths: [evidencePath, locationsStatics.siegelense.heartbeat] }),
      );

      const heartbeat = await fsReadFileAdapter({ filePath: heartbeatPath })
        .then((contents) => instanceHeartbeatContract.parse(JSON.parse(contents)))
        .catch((heartbeatReadError: unknown) => {
          // fsReadFileAdapter wraps every failure in a generic Error with the original as
          // `cause`, so ENOENT here means this instance's driver died before ever writing a
          // heartbeat — the orphan-reap path below then simply has no pgids to reap. Both
          // `heartbeatReadError` and its `.cause` are real `fs/promises` rejections built by
          // Node's own internals outside Jest's vm realm, where `instanceof Error` reads false
          // even though the value genuinely is one — `errorIsNativeErrorAdapter` checks the
          // V8-internal error slot instead. The null/typeof checks ahead of each adapter call are
          // what let the later property accesses typecheck.
          if (
            heartbeatReadError !== null &&
            typeof heartbeatReadError === 'object' &&
            errorIsNativeErrorAdapter({ value: heartbeatReadError }) &&
            'cause' in heartbeatReadError &&
            heartbeatReadError.cause !== null &&
            typeof heartbeatReadError.cause === 'object' &&
            errorIsNativeErrorAdapter({ value: heartbeatReadError.cause }) &&
            'code' in heartbeatReadError.cause &&
            heartbeatReadError.cause.code === 'ENOENT'
          ) {
            return null;
          }
          throw heartbeatReadError;
        });

      const reapedPgids = heartbeat?.pgids ?? [];

      await Promise.all(
        reapedPgids.map(async (pgid) => {
          processKillGroupAdapter({ pgid, signal: 'SIGTERM' });
          await new Promise<void>((resolve) => {
            setTimeout(resolve, driverStatics.teardown.graceMs);
          });
          if (processIsAliveAdapter({ pgid })) {
            processKillGroupAdapter({ pgid, signal: 'SIGKILL' });
          }
        }),
      );

      const homePath = absoluteFilePathContract.parse(
        pathJoinAdapter({ paths: [osTmpdirAdapter(), `dm-siege-${instanceId}`] }),
      );
      await fsRmAdapter({ dirPath: homePath });
      await instanceReleaseBroker({ instanceId });

      return killResultContract.parse({
        instanceId,
        stopped: true,
        portsReleased,
        homeRemoved: true,
        evidenceKept,
        reapedPgids,
      });
    });
};
