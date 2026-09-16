/**
 * PURPOSE: Assembles one `InstanceStatus` row from a registry row, its resolved state, and its
 * heartbeat file — the post-mortem `status` prints for one instance (siegelense-tooling.md lines
 * 1174-1183). `runs` (a count of run transcripts on disk) and `orphans` are always populated: neither
 * requires already holding this instance's id, so counting or checking liveness is not "browsing".
 * `lastStep` and `evidence` populate ONLY when `named` is true — a `status {}` fleet listing never
 * carries a run or an evidence path for an instance the caller has not already named
 * (chunk-03-read-path-and-perception.md §3.D, spec line 2380). `rssMB` (current) and `rssAtLastBeat`
 * (from the heartbeat file) never both carry a value: the first only while `state` is `'alive'`, the
 * second only once it is not.
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

import { pathJoinAdapter } from '@dungeonmaster/shared/adapters';
import { absoluteFilePathContract, fileNameContract } from '@dungeonmaster/shared/contracts';
import { locationsStatics } from '@dungeonmaster/shared/statics';

import { fsReadFileAdapter } from '../../../adapters/fs/read-file/fs-read-file-adapter';
import { fsReaddirAdapter } from '../../../adapters/fs/readdir/fs-readdir-adapter';
import { fsStatAdapter } from '../../../adapters/fs/stat/fs-stat-adapter';
import { epochMsContract } from '../../../contracts/epoch-ms/epoch-ms-contract';
import type { EpochMs } from '../../../contracts/epoch-ms/epoch-ms-contract';
import { instanceEvidenceListingContract } from '../../../contracts/instance-evidence-listing/instance-evidence-listing-contract';
import { instanceStatusContract } from '../../../contracts/instance-status/instance-status-contract';
import type { InstanceStatus } from '../../../contracts/instance-status/instance-status-contract';
import type { InstanceState } from '../../../contracts/instance-state/instance-state-contract';
import { lastStepReadingContract } from '../../../contracts/last-step-reading/last-step-reading-contract';
import type { ReadingCount } from '../../../contracts/reading-count/reading-count-contract';
import { readingCountContract } from '../../../contracts/reading-count/reading-count-contract';
import type { RegistryEntry } from '../../../contracts/registry-entry/registry-entry-contract';
import { runIdContract } from '../../../contracts/run-id/run-id-contract';
import type { RunId } from '../../../contracts/run-id/run-id-contract';
import { stepReadingContract } from '../../../contracts/step-reading/step-reading-contract';
import { elapsedRenderTransformer } from '../../../transformers/elapsed-render/elapsed-render-transformer';
import { heartbeatReadBroker } from '../../heartbeat/read/heartbeat-read-broker';
import { locationsInstanceEvidencePathFindBroker } from '../../locations/instance-evidence-path-find/locations-instance-evidence-path-find-broker';
import { locationsRepoLinkPathFindBroker } from '../../locations/repo-link-path-find/locations-repo-link-path-find-broker';
import { machineRssByPgidBroker } from '../../machine/rss-by-pgid/machine-rss-by-pgid-broker';
import { orphanReadBroker } from '../../orphan/read/orphan-read-broker';
import { instanceLifecycleStatics } from '../../../statics/instance-lifecycle/instance-lifecycle-statics';
import { evidenceFileStatics } from '../../../statics/evidence-file/evidence-file-statics';
import { likelyCauseLayerBroker } from './likely-cause-layer-broker';

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
  // Invoked here, BEFORE runsDirPath, and only awaited below: `heartbeatReadBroker` resolves this
  // SAME instance's evidence dir all over again internally, and that resolution has to run to
  // completion before the next, unrelated `pathJoinAdapter` call below — the one computing
  // `runsDirPath` — reaches the real npm `path.join` this proxy setup leaves as its sticky default
  // rather than an unconsumed stand-in still queued for heartbeatReadBroker's own resolution.
  const heartbeatPromise = heartbeatReadBroker({ instanceId: entry.id, guildId: entry.guildId });
  const runsDirPath = absoluteFilePathContract.parse(
    pathJoinAdapter({ paths: [evidenceDir, locationsStatics.siegelense.runsDir] }),
  );

  const [heartbeat, runsDirEntries, orphans, rssMB] = await Promise.all([
    heartbeatPromise,
    fsReaddirAdapter({ dirPath: runsDirPath }),
    orphanReadBroker({ pgids: entry.pgids }),
    state === 'alive' ? machineRssByPgidBroker({ pgids: entry.pgids }) : Promise.resolve(null),
  ]);

  const transcriptNames = runsDirEntries.filter((name) =>
    name.endsWith(evidenceFileStatics.extensions.transcript),
  );
  const runs = readingCountContract.parse(transcriptNames.length);

  // The highest-numbered run transcript on disk is the most recent one — run ids count upward for
  // the life of an instance and never repeat, so a numeric max over the stripped `run_N` names is
  // "the last run" without needing a listing broker of its own.
  const lastRunId: RunId | null =
    transcriptNames.length === 0
      ? null
      : runIdContract.parse(
          transcriptNames
            .map((name) => name.slice(0, -evidenceFileStatics.extensions.transcript.length))
            .reduce((latest, candidate) =>
              Number(candidate.slice(instanceLifecycleStatics.ids.runPrefix.length)) >
              Number(latest.slice(instanceLifecycleStatics.ids.runPrefix.length))
                ? candidate
                : latest,
            ),
        );

  const uptime =
    state === 'alive' && entry.bootedAtMs !== null
      ? elapsedRenderTransformer({ elapsedMs: epochMsContract.parse(nowMs - entry.bootedAtMs) })
      : null;

  const lastBeat =
    entry.lastBeatMs === null
      ? null
      : elapsedRenderTransformer({ elapsedMs: epochMsContract.parse(nowMs - entry.lastBeatMs) });

  const rssAtLastBeat = state === 'alive' ? null : (heartbeat?.rssMB ?? null);

  const likelyCause = likelyCauseLayerBroker({
    state,
    specName: entry.specName,
    rssAtLastBeat,
    oomKillsSinceBoot,
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
    });
  }

  const [apiLogStat, webLogStat, repoLocalDir] = await Promise.all([
    fsStatAdapter({
      filePath: absoluteFilePathContract.parse(
        pathJoinAdapter({ paths: [evidenceDir, locationsStatics.siegelense.apiLog] }),
      ),
    }),
    fsStatAdapter({
      filePath: absoluteFilePathContract.parse(
        pathJoinAdapter({ paths: [evidenceDir, locationsStatics.siegelense.webLog] }),
      ),
    }),
    locationsRepoLinkPathFindBroker({ homePath: evidenceDir }),
  ]);

  const logs = [
    ...(apiLogStat === null ? [] : [fileNameContract.parse(locationsStatics.siegelense.apiLog)]),
    ...(webLogStat === null ? [] : [fileNameContract.parse(locationsStatics.siegelense.webLog)]),
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
    });
  }

  const transcriptPath = absoluteFilePathContract.parse(
    pathJoinAdapter({
      paths: [runsDirPath, `${lastRunId}${evidenceFileStatics.extensions.transcript}`],
    }),
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
  });
};
