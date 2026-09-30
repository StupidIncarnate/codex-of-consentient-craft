/**
 * PURPOSE: The thin client half of `kill` — sends `kill` down the instance's socket and reports
 * what the driver's own teardown actually stopped (its response payload names those process
 * groups — see `laneTeardownBroker`), or, when the socket refuses (a SIGKILLed driver — spec line
 * 1122), falls back to the ORPHAN REAP path: SIGTERM-then-SIGKILL every pgid the REGISTRY ROW still
 * names, remove the throwaway home, and mark the registry row killed. The registry, never
 * `heartbeat.json`, is the source of candidate pgids for a reap — `heartbeat.json` is evidence and
 * is NEVER rewritten again once an instance stops (packages/siegelense/CLAUDE.md), so a SECOND kill
 * of an already-tombstoned instance would keep reading the SAME stale pgids forever and re-signal
 * whatever the OS has since handed those numbers to. The registry has no such staleness problem:
 * `instanceReleaseBroker` clears `pgids` to `[]` the moment ANY kill (this path or the driver's own)
 * finishes, so a row already at rest here answers with nothing left to reap by construction, and
 * this broker short-circuits on `entry.state !== 'alive'` before it ever asks the OS about a pgid.
 * A candidate that IS still eligible gets ONE more check before either signal: `processIsAliveBroker`
 * — the same gate `laneTeardownBroker` uses — so a pgid the OS already recycled to an unrelated
 * process never receives a signal this broker did not verify was still this lane's own group.
 * Either path removes ONLY the throwaway home and never the evidence directory (logs, captures and
 * the transcript are evidence and outlive the instance), and either path accepts an already-dead
 * instance's id, since that is how a session reaps an orphan it can see in `status` (spec line
 * 1172) — though an already-tombstoned one now reaps nothing, on purpose. This broker is the SAME
 * reap path `staleReapLayerBroker` (cleanup) calls for a stale row, so the orphan-reap branch also
 * (re)writes `shutdown-reason.json` once it actually reaps a process group — for either caller — so
 * `status`'s `likelyCause` reflects that something outside the driver stopped it, rather than a
 * stale idle-timeout reason the driver's own self-reap recorded earlier before this call ever ran.
 *
 * `reason` lets a caller that already knows WHY it is reaping (cleanup's own staleness detection)
 * name that cause instead of the generic "reaped N orphaned process groups" wording — so
 * `likelyCause` says what really ended the instance rather than only how it was torn down. Omitted
 * by an explicit `kill` call, which has no cause of its own beyond the user's own request.
 *
 * USAGE:
 * await instanceKillBroker({ instanceId });
 * // Driver reachable: sends `kill`, returns { stopped: true, killed: [...groups the driver actually
 * // stopped], reapedPgids: [] }
 * // Driver unreachable, row still alive: reaps the registry's own recorded pgids that are still
 * // live, returns { stopped: true, reapedPgids: [...] }
 * // Row already killed/pruned/unusable: no-op, returns { stopped: true, reapedPgids: [] }
 *
 * await instanceKillBroker({ instanceId, reason: 'reaped by cleanup after its heartbeat went stale' });
 * // Driver unreachable, live pgids reaped: shutdown-reason.json is written with the SUPPLIED reason
 * // rather than the generic "reaped N orphaned process groups" wording
 */

import { rm } from '#gateway/node/fs__promises';
import { tmpdir } from '#gateway/node/os';
import { join } from '#gateway/node/path';
import { stderr } from '#gateway/node/process';
import { setTimeout } from '#gateway/node/setTimeout';
import type { SiegeInstance } from '@dungeonmaster/shared/contracts';

import { driverSocketRequestBroker } from '../../driver/socket-request/driver-socket-request-broker';
import { processIsAliveBroker } from '../../process/is-alive/process-is-alive-broker';
import { processKillGroupBroker } from '../../process/kill-group/process-kill-group-broker';
import { driverRequestContract } from '../../../contracts/driver-request/driver-request-contract';
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
  instanceId: SiegeInstance['id'];
  reason?: string;
}): Promise<KillResult> => {
  const registry = await registryReadBroker();
  const entry = registry.instances.find((candidate) => candidate.id === instanceId);
  const guildId = entry?.guildId ?? null;
  const portsReleased = entry === undefined ? [] : [entry.ports.api, entry.ports.web];
  const socketPath = entry?.socketPath ?? locationsSocketPathFindBroker({ instanceId });

  const evidencePath = locationsInstanceEvidencePathFindBroker({ instanceId, guildId });
  const evidenceKept = await locationsRepoLinkPathFindBroker({ homePath: evidencePath });

  // A row already tombstoned has nothing left this broker may touch — `instanceReleaseBroker`
  // already cleared its `pgids`, and re-deriving a candidate list from anywhere else (the only
  // other source being `heartbeat.json`, which is never rewritten again) is how a repeat kill would
  // re-signal numbers the OS may have long since handed to an unrelated process.
  if (entry !== undefined && entry.state !== 'alive') {
    return killResultContract.parse({
      instanceId,
      stopped: true,
      portsReleased,
      homeRemoved: true,
      evidenceKept,
      reapedPgids: [],
      alreadyKilledAtMs: entry.killedAtMs ?? entry.prunedAtMs,
    });
  }

  const request = driverRequestContract.parse({
    kind: 'kill',
    payload: '',
  });

  return driverSocketRequestBroker({
    socketPath,
    request,
    timeoutMs: driverStatics.socket.requestTimeoutMs,
  })
    .then((response): KillResult => {
      // The driver's own teardown (`laneTeardownBroker`) reports exactly which process groups it
      // stopped in its response payload — parsed defensively, since a malformed or unexpected
      // payload must not fail the kill itself, only cost it the accurate count.
      const driverKillResult = ((): KillResult | null => {
        try {
          return killResultContract.parse(JSON.parse(response.payload));
        } catch (parseError: unknown) {
          stderr.write(
            `instanceKillBroker: parsing ${instanceId}'s driver kill response failed, reporting no stopped process groups: ${String(parseError)}\n`,
          );
          return null;
        }
      })();

      return killResultContract.parse({
        instanceId,
        stopped: true,
        portsReleased,
        homeRemoved: true,
        evidenceKept,
        reapedPgids: [],
        ...(driverKillResult?.killed === undefined ? {} : { killed: driverKillResult.killed }),
      });
    })
    .catch(async (): Promise<KillResult> => {
      // The registry row's OWN pgids, never `heartbeat.json` — see this broker's PURPOSE for why.
      // A candidate must also still be ALIVE to be signalled at all: the row can be minutes old by
      // the time a socket ever refuses, and a dead pgid needs neither signal.
      const candidatePgids = (entry?.pgids ?? []).filter((pgid) => processIsAliveBroker({ pgid }));

      await Promise.all(
        candidatePgids.map(async (pgid) => {
          processKillGroupBroker({ pgid, signal: 'SIGTERM' });
          await new Promise<void>((resolve) => {
            setTimeout(resolve, driverStatics.teardown.graceMs);
          });
          if (processIsAliveBroker({ pgid })) {
            processKillGroupBroker({ pgid, signal: 'SIGKILL' });
          }
        }),
      );

      // An idle-reap self-teardown already wrote its own shutdown-reason.json before this instance
      // ever needed reaping (driver-serve-layer-responder.ts's own idle path) — that record is stale
      // the moment THIS call finds live process groups still needing a signal, because an explicit
      // kill, not the idle timeout, is what actually ended them. Overwriting it is the only way
      // status's likelyCause (which reads this file verbatim) reflects what really happened; nothing
      // here touches the reap sequence above or how status derives the reading from this file.
      if (candidatePgids.length > 0) {
        await shutdownReasonWriteBroker({
          evidencePath,
          reason:
            reason ??
            `reaped ${candidatePgids.length} orphaned process group${
              candidatePgids.length === 1 ? '' : 's'
            } outside the idle timeout`,
        });
      }

      const homePath = join(tmpdir(), `dm-siege-${instanceId}`);
      await rm(homePath, { recursive: true, force: true });
      await instanceReleaseBroker({ instanceId });

      return killResultContract.parse({
        instanceId,
        stopped: true,
        portsReleased,
        homeRemoved: true,
        evidenceKept,
        reapedPgids: candidatePgids,
      });
    });
};
