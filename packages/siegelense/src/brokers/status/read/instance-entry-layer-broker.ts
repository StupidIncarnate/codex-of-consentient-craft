/**
 * PURPOSE: Assembles one `InstanceStatus` row from a registry row, its resolved state, and its
 * heartbeat file — the post-mortem `status` prints for one instance (siegelense-tooling.md lines
 * 1174-1183). `runs` and `lastRunSaved` are always populated: neither requires already holding
 * this instance's id, so counting or checking completeness is not "browsing". Both come off
 * `runEvidenceComputeTransformer` — the SAME function `results`' `runListLayerBroker` calls — so the
 * two tools can never disagree about how many runs an instance holds or whether the latest one
 * finished; `lastRunSaved` is `null` for an instance with no run at all. `lastStep` and `evidence`
 * populate ONLY when `named` is true — a `status {}` fleet
 * listing never carries a run or an evidence path for an instance the caller has not already named
 * (chunk-03-read-path-and-perception.md §3.D, spec line 2380). A named `evidence` is the directory
 * plus EVERY file `evidenceTreeLayerBroker` finds under it, each an absolute path — never a fixed set
 * of known names, so a file kind nobody named (a recorded video) still shows. `memory` is the live process-group
 * reading while `state` is `'alive'` and the heartbeat file's last figure once it is not, tagged
 * with which one it is. `orphans` draws the SAME line: it is `[]` while `state` is `'alive'`, and
 * `orphanReadBroker` runs at all only once it is not — a live instance's own pgids are its
 * actively-managed lane, never a leak, and the spec reserves "orphans" for what a dead one's driver
 * left BEHIND (siegelense-tooling.md:2497-2500, "a dead one carries … its surviving orphan pgids").
 * Reporting an alive instance's own lane under that name reads as a leak that is not there.
 * `shutdownReasonReadBroker` draws the SAME line as `orphans`/`memory`: it runs only once
 * `state` is not `'alive'`, and its result feeds `likelyCauseLayerBroker` so a driver's own recorded
 * reason for tearing its lane down (an idle-timeout self-reap) reaches `likelyCause` verbatim instead
 * of the RSS/OOM reading standing in for it.
 *
 * USAGE:
 * await instanceEntryLayerBroker({
 *   entry: RegistryEntryStub(),
 *   state: InstanceStateStub({ value: 'dead' }),
 *   named: true,
 *   nowMs: 1_700_000_000_000,
 *   oomKillsSinceBoot: 2,
 *   repoRoot: '/repo',
 * });
 * // Returns a validated InstanceStatus
 */

import { join } from '#gateway/node/path';
import { locationsStatics } from '@dungeonmaster/shared/statics';
import { readdirIfExists, readFile } from '#gateway/node/fs__promises';
import { shutdownReasonReadBroker } from '../../shutdown-reason/read/shutdown-reason-read-broker';
import { instanceEvidenceListingContract } from '../../../contracts/instance-evidence-listing/instance-evidence-listing-contract';
import { instanceMemoryContract } from '../../../contracts/instance-memory/instance-memory-contract';
import { instanceStatusContract } from '../../../contracts/instance-status/instance-status-contract';
import type { InstanceStatus } from '../../../contracts/instance-status/instance-status-contract';
import type { InstanceState } from '../../../contracts/instance-state/instance-state-contract';
import { lastStepReadingContract } from '../../../contracts/last-step-reading/last-step-reading-contract';
import type { OrphanReading } from '../../../contracts/orphan-reading/orphan-reading-contract';
import type { RegistryEntry } from '../../../contracts/registry-entry/registry-entry-contract';
import { stepReadingContract } from '../../../contracts/step-reading/step-reading-contract';
import { elapsedRenderTransformer } from '../../../transformers/elapsed-render/elapsed-render-transformer';
import { runEvidenceComputeTransformer } from '../../../transformers/run-evidence-compute/run-evidence-compute-transformer';
import { heartbeatReadBroker } from '../../heartbeat/read/heartbeat-read-broker';
import { locationsInstanceEvidencePathFindBroker } from '../../locations/instance-evidence-path-find/locations-instance-evidence-path-find-broker';
import { locationsRepoLinkPathFindBroker } from '../../locations/repo-link-path-find/locations-repo-link-path-find-broker';
import { machineRssByPgidBroker } from '@dungeonmaster/load-balancer/brokers';
import { orphanReadBroker } from '../../orphan/read/orphan-read-broker';
import { evidenceFileStatics } from '../../../statics/evidence-file/evidence-file-statics';
import { evidenceTreeLayerBroker } from './evidence-tree-layer-broker';
import { likelyCauseLayerBroker } from './likely-cause-layer-broker';
import { profileSoloReadLayerBroker } from './profile-solo-read-layer-broker';

export const instanceEntryLayerBroker = async ({
  entry,
  state,
  named,
  nowMs,
  oomKillsSinceBoot,
  repoRoot,
}: {
  entry: RegistryEntry;
  state: InstanceState;
  named: boolean;
  nowMs: number;
  oomKillsSinceBoot: number | null;
  repoRoot: string;
}): Promise<InstanceStatus> => {
  const evidenceDir = locationsInstanceEvidencePathFindBroker({
    instanceId: entry.id,
    guildId: entry.guildId,
  });
  const heartbeatPromise = heartbeatReadBroker({ instanceId: entry.id, guildId: entry.guildId });
  const runsDirPath = join(evidenceDir, locationsStatics.siegelense.runsDir);

  const [heartbeat, runsDirEntriesRaw, orphans, rssMB, shutdownReasonMarker] = await Promise.all([
    heartbeatPromise,
    readdirIfExists(runsDirPath),
    state === 'alive'
      ? Promise.resolve<readonly OrphanReading[]>([])
      : orphanReadBroker({ pgids: entry.pgids }),
    state === 'alive' ? machineRssByPgidBroker({ pgids: entry.pgids }) : Promise.resolve(null),
    state === 'alive'
      ? Promise.resolve(null)
      : shutdownReasonReadBroker({ evidencePath: evidenceDir }),
  ]);
  const runsDirEntries = runsDirEntriesRaw ?? [];

  const {
    runCount: runs,
    latestRunId: lastRunId,
    evidenceComplete,
  } = runEvidenceComputeTransformer({ entries: runsDirEntries });

  const uptime =
    state === 'alive' && entry.bootedAtMs !== null
      ? elapsedRenderTransformer({ elapsedMs: nowMs - entry.bootedAtMs })
      : null;

  const lastBeat =
    entry.lastBeatMs === null
      ? null
      : elapsedRenderTransformer({ elapsedMs: nowMs - entry.lastBeatMs });

  const rssAtLastBeat = state === 'alive' ? null : (heartbeat?.rssMB ?? null);
  const memory =
    state === 'alive'
      ? rssMB === null
        ? null
        : instanceMemoryContract.parse({ megabytes: rssMB, measured: 'live' })
      : rssAtLastBeat === null
        ? null
        : instanceMemoryContract.parse({ megabytes: rssAtLastBeat, measured: 'at-last-beat' });
  const lastRunSaved = lastRunId === null ? null : evidenceComplete;

  // Sequential, run only AFTER the Promise.all above has fully settled, so a solo-profile read
  // never races the heartbeat, runs-directory and /proc reads it is diagnosing alongside.
  const soloProfile =
    state === 'alive'
      ? null
      : await profileSoloReadLayerBroker({ specName: entry.specName, repoRoot });

  const likelyCause = likelyCauseLayerBroker({
    state,
    specName: entry.specName,
    rssAtLastBeat,
    oomKillsSinceBoot,
    shutdownReason: shutdownReasonMarker === null ? null : shutdownReasonMarker.reason,
    soloProfile,
  });

  if (!named) {
    return instanceStatusContract.parse({
      id: entry.id,
      state,
      specName: entry.specName,
      uptime,
      lastBeat,
      runs,
      memory,
      lastStep: null,
      orphans,
      evidence: null,
      likelyCause,
      branch: entry.branch ?? null,
      lastRunSaved,
    });
  }

  const repoLocalDir = await locationsRepoLinkPathFindBroker({ homePath: evidenceDir, repoRoot });
  const evidence = instanceEvidenceListingContract.parse({
    dir: repoLocalDir,
    files: await evidenceTreeLayerBroker({ homeDir: evidenceDir, repoLocalDir: repoLocalDir.path }),
  });

  if (lastRunId === null) {
    return instanceStatusContract.parse({
      id: entry.id,
      state,
      specName: entry.specName,
      uptime,
      lastBeat,
      runs,
      memory,
      lastStep: null,
      orphans,
      evidence,
      likelyCause,
      branch: entry.branch ?? null,
      lastRunSaved,
    });
  }

  const transcriptPath = join(
    runsDirPath,
    `${lastRunId}${evidenceFileStatics.extensions.transcript}`,
  );
  const transcriptContent = await readFile(transcriptPath);
  const transcriptLines = transcriptContent.split('\n').filter((line) => line.length > 0);
  const lastLine = transcriptLines[transcriptLines.length - 1];
  const lastReading =
    lastLine === undefined ? null : stepReadingContract.parse(JSON.parse(lastLine));

  return instanceStatusContract.parse({
    id: entry.id,
    state,
    specName: entry.specName,
    uptime,
    lastBeat,
    runs,
    memory,
    lastStep:
      lastReading === null
        ? null
        : lastStepReadingContract.parse({
            run: lastRunId,
            step: lastReading.step,
            verb: lastReading.verb,
          }),
    orphans,
    evidence,
    likelyCause,
    branch: entry.branch ?? null,
    lastRunSaved,
  });
};
