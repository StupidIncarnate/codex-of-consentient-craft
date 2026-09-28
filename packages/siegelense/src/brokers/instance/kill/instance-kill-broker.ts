/**
 * PURPOSE: The thin client half of `kill` — sends `kill` down the instance's socket and reports
 * what the driver did, or, when the socket refuses (a SIGKILLed driver — spec line 1122), falls
 * back to the ORPHAN REAP path: read the heartbeat file's recorded pgids, SIGTERM-then-SIGKILL
 * each process group, remove the throwaway home, and mark the registry row killed. Either path
 * removes ONLY the throwaway home and never the evidence directory (packages/siegelense/CLAUDE.md
 * — logs, captures and the transcript are evidence and outlive the instance), and either path
 * accepts an already-dead instance's id, since that is how a session reaps an orphan it can see in
 * `status` (spec line 1172). This broker is the SAME reap path `staleReapLayerBroker` (cleanup) calls
 * for a stale row, so the orphan-reap branch also (re)writes `shutdown-reason.json` once it actually
 * reaps a process group — for either caller — so `status`'s `likelyCause` reflects that something
 * outside the driver stopped it, rather than a stale idle-timeout reason the driver's own self-reap
 * recorded earlier before this call ever ran.
 *
 * `reason` lets a caller that already knows WHY it is reaping (cleanup's own staleness detection)
 * name that cause instead of the generic "reaped N orphaned process groups" wording — so
 * `likelyCause` says what really ended the instance rather than only how it was torn down. Omitted
 * by an explicit `kill` call, which has no cause of its own beyond the user's own request.
 *
 * USAGE:
 * await instanceKillBroker({ instanceId });
 * // Driver reachable: sends `kill`, returns { stopped: true, reapedPgids: [], ... }
 * // Driver unreachable: reaps the heartbeat's pgids, returns { stopped: true, reapedPgids: [...] }
 *
 * await instanceKillBroker({ instanceId, reason: ContentTextStub({ value: 'reaped by cleanup after its heartbeat went stale' }) });
 * // Driver unreachable, pgids reaped: shutdown-reason.json is written with the SUPPLIED reason
 * // rather than the generic "reaped N orphaned process groups" wording
 */

import { pathJoinAdapter } from '@dungeonmaster/shared/adapters';
import { absoluteFilePathContract, contentTextContract } from '@dungeonmaster/shared/contracts';
import type { ContentText } from '@dungeonmaster/shared/contracts';
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
import { shutdownReasonWriteBroker } from '../../shutdown-reason/write/shutdown-reason-write-broker';
import { driverStatics } from '../../../statics/driver/driver-statics';

export const instanceKillBroker = async ({
  instanceId,
  reason,
}: {
  instanceId: InstanceId;
  reason?: ContentText;
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

      // An idle-reap self-teardown already wrote its own shutdown-reason.json before this instance
      // ever needed reaping (driver-serve-layer-responder.ts's own idle path) — that record is stale
      // the moment THIS call finds live process groups still needing a signal, because an explicit
      // kill, not the idle timeout, is what actually ended them. Overwriting it is the only way
      // status's likelyCause (which reads this file verbatim) reflects what really happened; nothing
      // here touches the reap sequence above or how status derives the reading from this file.
      if (reapedPgids.length > 0) {
        await shutdownReasonWriteBroker({
          evidencePath,
          reason:
            reason ??
            contentTextContract.parse(
              `reaped ${reapedPgids.length} orphaned process group${
                reapedPgids.length === 1 ? '' : 's'
              } outside the idle timeout`,
            ),
        });
      }

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
