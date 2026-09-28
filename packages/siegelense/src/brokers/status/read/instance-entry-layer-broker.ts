/**
 * PURPOSE: Assembles one `InstanceStatus` row from a registry row, its resolved state, and its
 * heartbeat file — the post-mortem `status` prints for one instance (siegelense-tooling.md lines
 * 1174-1183). `runs` and `evidenceComplete` are always populated: neither requires already holding
 * this instance's id, so counting or checking completeness is not "browsing". Both come off
 * `runEvidenceComputeTransformer` — the SAME function `results`' `runListLayerBroker` calls — so the
 * two tools can never disagree about how many runs an instance holds or whether the latest one
 * finished. `lastStep` and `evidence` populate ONLY when `named` is true — a `status {}` fleet
 * listing never carries a run or an evidence path for an instance the caller has not already named
 * (chunk-03-read-path-and-perception.md §3.D, spec line 2380). `rssMB` (current) and `rssAtLastBeat`
 * (from the heartbeat file) never both carry a value: the first only while `state` is `'alive'`, the
 * second only once it is not. `orphans` draws the SAME line: it is `[]` while `state` is `'alive'`,
 * and `orphanReadBroker` runs at all only once it is not — a live instance's own pgids are its
 * actively-managed lane, never a leak, and the spec reserves "orphans" for what a dead one's driver
 * left BEHIND (siegelense-tooling.md:2497-2500, "a dead one carries … its surviving orphan pgids").
 * Reporting an alive instance's own lane under that name reads as a leak that is not there.
 * `shutdownReasonReadBroker` draws the SAME line as `orphans`/`rssAtLastBeat`: it runs only once
 * `state` is not `'alive'`, and its result feeds `likelyCauseLayerBroker` so a driver's own recorded
 * reason for tearing its lane down (an idle-timeout self-reap) reaches `likelyCause` verbatim instead
 * of the RSS/OOM reading standing in for it.
 *
 * USAGE:
 * await instanceEntryLayerBroker({
 *   entry: RegistryEntryStub(),
 *   state: InstanceStateStub({ value: 'dead' }),
 *   named: true,
 *   nowMs: EpochMsStub(),
 *   oomKillsSinceBoot: ReadingCountStub({ value: 2 }),
 * });
 * // Returns a validated InstanceStatus
 */

import { join } from '#gateway/node/path';
import { absoluteFilePathContract, fileNameContract } from '@dungeonmaster/shared/contracts';
import { locationsStatics } from '@dungeonmaster/shared/statics';

import { fsReadFileAdapter } from '../../../adapters/fs/read-file/fs-read-file-adapter';
import { readdirIfExists } from '#gateway/node/fs__promises';
import { fsStatAdapter } from '../../../adapters/fs/stat/fs-stat-adapter';
import { shutdownReasonReadBroker } from '../../shutdown-reason/read/shutdown-reason-read-broker';
import { epochMsContract } from '../../../contracts/epoch-ms/epoch-ms-contract';
import type { EpochMs } from '../../../contracts/epoch-ms/epoch-ms-contract';
import { instanceEvidenceListingContract } from '../../../contracts/instance-evidence-listing/instance-evidence-listing-contract';
import { instanceStatusContract } from '../../../contracts/instance-status/instance-status-contract';
import type { InstanceStatus } from '../../../contracts/instance-status/instance-status-contract';
import type { InstanceState } from '../../../contracts/instance-state/instance-state-contract';
import { lastStepReadingContract } from '../../../contracts/last-step-reading/last-step-reading-contract';
import type { OrphanReading } from '../../../contracts/orphan-reading/orphan-reading-contract';
import type { ReadingCount } from '../../../contracts/reading-count/reading-count-contract';
import type { RegistryEntry } from '../../../contracts/registry-entry/registry-entry-contract';
import { stepReadingContract } from '../../../contracts/step-reading/step-reading-contract';
import { elapsedRenderTransformer } from '../../../transformers/elapsed-render/elapsed-render-transformer';
import { runEvidenceComputeTransformer } from '../../../transformers/run-evidence-compute/run-evidence-compute-transformer';
import { heartbeatReadBroker } from '../../heartbeat/read/heartbeat-read-broker';
import { locationsInstanceEvidencePathFindBroker } from '../../locations/instance-evidence-path-find/locations-instance-evidence-path-find-broker';
import { locationsRepoLinkPathFindBroker } from '../../locations/repo-link-path-find/locations-repo-link-path-find-broker';
import { machineRssByPgidBroker } from '../../machine/rss-by-pgid/machine-rss-by-pgid-broker';
import { orphanReadBroker } from '../../orphan/read/orphan-read-broker';
import { evidenceFileStatics } from '../../../statics/evidence-file/evidence-file-statics';
import { likelyCauseLayerBroker } from './likely-cause-layer-broker';
import { profileSoloReadLayerBroker } from './profile-solo-read-layer-broker';

export const instanceEntryLayerBroker = async ({
  entry,
  state,
  named,
  nowMs,
  oomKillsSinceBoot,
}: {
  entry: RegistryEntry;
  state: InstanceState;
  named: boolean;
  nowMs: EpochMs;
  oomKillsSinceBoot: ReadingCount | null;
}): Promise<InstanceStatus> => {
  const evidenceDir = locationsInstanceEvidencePathFindBroker({
    instanceId: entry.id,
    guildId: entry.guildId,
  });
  const heartbeatPromise = heartbeatReadBroker({ instanceId: entry.id, guildId: entry.guildId });
  const runsDirPath = absoluteFilePathContract.parse(
    join(evidenceDir, locationsStatics.siegelense.runsDir),
  );

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
      ? elapsedRenderTransformer({ elapsedMs: epochMsContract.parse(nowMs - entry.bootedAtMs) })
      : null;

  const lastBeat =
    entry.lastBeatMs === null
      ? null
      : elapsedRenderTransformer({ elapsedMs: epochMsContract.parse(nowMs - entry.lastBeatMs) });

  const rssAtLastBeat = state === 'alive' ? null : (heartbeat?.rssMB ?? null);

  // Sequential, run only AFTER the Promise.all above has fully settled: profileSoloReadLayerBroker
  // reaches profileReadBroker, which joins its own paths through the SAME shared pathJoinAdapter
  // queue every other call above stages explicitly, in a fixed order (instance-entry-layer-broker.proxy.ts's
  // own header). Racing it alongside that Promise.all would consume a queue entry staged for one of
  // those other calls instead of computing its own real join.
  const soloProfile =
    state === 'alive' ? null : await profileSoloReadLayerBroker({ specName: entry.specName });

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
      rssMB,
      rssAtLastBeat,
      lastStep: null,
      orphans,
      evidence: null,
      likelyCause,
      branch: entry.branch ?? null,
      evidenceComplete,
    });
  }

  const [apiLogStat, webLogStat, driverLogStat, repoLocalDir] = await Promise.all([
    fsStatAdapter({
      filePath: absoluteFilePathContract.parse(
        join(evidenceDir, locationsStatics.siegelense.apiLog),
      ),
    }),
    fsStatAdapter({
      filePath: absoluteFilePathContract.parse(
        join(evidenceDir, locationsStatics.siegelense.webLog),
      ),
    }),
    fsStatAdapter({
      filePath: absoluteFilePathContract.parse(
        join(evidenceDir, locationsStatics.siegelense.driverLog),
      ),
    }),
    locationsRepoLinkPathFindBroker({ homePath: evidenceDir }),
  ]);

  // Full repo-local paths, not bare names — a bare "api-server.log" gives a reader nothing to
  // `Read`. `fileNameContract` is an unbranded-format string brand (no path-shape constraint), so a
  // full path parses through it cleanly; reusing it here — rather than widening the
  // `instanceEvidenceListingContract.logs` element type to something path-shaped — is what keeps
  // this a broker-only change.
  const logs = [
    ...(apiLogStat === null
      ? []
      : [fileNameContract.parse(join(repoLocalDir.path, locationsStatics.siegelense.apiLog))]),
    ...(webLogStat === null
      ? []
      : [fileNameContract.parse(join(repoLocalDir.path, locationsStatics.siegelense.webLog))]),
    ...(driverLogStat === null
      ? []
      : [fileNameContract.parse(join(repoLocalDir.path, locationsStatics.siegelense.driverLog))]),
  ];

  if (lastRunId === null) {
    return instanceStatusContract.parse({
      id: entry.id,
      state,
      specName: entry.specName,
      uptime,
      lastBeat,
      runs,
      rssMB,
      rssAtLastBeat,
      lastStep: null,
      orphans,
      evidence: instanceEvidenceListingContract.parse({
        dir: repoLocalDir,
        transcript: null,
        logs,
        lastShot: null,
      }),
      likelyCause,
      branch: entry.branch ?? null,
      evidenceComplete,
    });
  }

  const transcriptPath = absoluteFilePathContract.parse(
    join(runsDirPath, `${lastRunId}${evidenceFileStatics.extensions.transcript}`),
  );
  const transcriptContent = await fsReadFileAdapter({ filePath: transcriptPath });
  const transcriptLines = transcriptContent.split('\n').filter((line) => line.length > 0);
  const lastLine = transcriptLines[transcriptLines.length - 1];

  if (lastLine === undefined) {
    return instanceStatusContract.parse({
      id: entry.id,
      state,
      specName: entry.specName,
      uptime,
      lastBeat,
      runs,
      rssMB,
      rssAtLastBeat,
      lastStep: null,
      orphans,
      evidence: instanceEvidenceListingContract.parse({
        dir: repoLocalDir,
        transcript: fileNameContract.parse(
          `${lastRunId}${evidenceFileStatics.extensions.transcript}`,
        ),
        logs,
        lastShot: null,
      }),
      likelyCause,
      branch: entry.branch ?? null,
      evidenceComplete,
    });
  }

  const lastReading = stepReadingContract.parse(JSON.parse(lastLine));
  const lastStep = lastStepReadingContract.parse({
    run: lastRunId,
    step: lastReading.step,
    verb: lastReading.verb,
  });
  const lastShot =
    lastReading.shot === null
      ? null
      : fileNameContract.parse(
          `${lastRunId}/${evidenceFileStatics.naming.shotPrefix}${lastReading.step}${evidenceFileStatics.extensions.shot}`,
        );

  return instanceStatusContract.parse({
    id: entry.id,
    state,
    specName: entry.specName,
    uptime,
    lastBeat,
    runs,
    rssMB,
    rssAtLastBeat,
    lastStep,
    orphans,
    evidence: instanceEvidenceListingContract.parse({
      dir: repoLocalDir,
      transcript: fileNameContract.parse(
        `${lastRunId}${evidenceFileStatics.extensions.transcript}`,
      ),
      logs,
      lastShot,
    }),
    likelyCause,
    branch: entry.branch ?? null,
    evidenceComplete,
  });
};
