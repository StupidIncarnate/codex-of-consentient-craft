/**
 * PURPOSE: Keeps one running instance findable two different ways, for two different readers.
 * Stamps `registry.json`'s `lastBeatMs` — what `capacity` and `cleanup` read on every fleet-wide
 * question, without opening N instances' worth of files just to ask "is anything stale" (spec line
 * 134). Writes `heartbeat.json` into that instance's own evidence directory — the file a post-mortem
 * `Read`s once the driver holding them is SIGKILLed, because nothing in memory survives that to hand
 * the pgids back; the row can say "how long since the last beat", the file is the only place the
 * orphaned process-group ids themselves are recorded (spec lines 1132-1133, 1672). `rssMB` is measured
 * over these SAME pgids via `machineRssByPgidBroker` and written into the beat itself — the last
 * chance to record it while the pgids are still alive, since `status` reads it back as a dead
 * instance's `rssAtLastBeat` rather than trying to re-measure a process group that may already be
 * gone. That measurement happens AFTER both path-resolving calls below, never before: reordering it
 * earlier would race it against the evidence-dir and heartbeat-path resolution in a mocked test.
 *
 * USAGE:
 * await heartbeatWriteBroker({
 *   instanceId: InstanceIdStub(),
 *   pid: ProcessIdStub(),
 *   pgids: [ProcessGroupIdStub()],
 *   guildId: null,
 * });
 * // Writes heartbeat.json under the instance's evidence dir, stamps its registry row, and returns
 * // the written InstanceHeartbeat
 */

import { pathJoinAdapter } from '@dungeonmaster/shared/adapters';
import { absoluteFilePathContract, fileContentsContract } from '@dungeonmaster/shared/contracts';
import type { GuildId, ProcessId } from '@dungeonmaster/shared/contracts';
import { locationsStatics } from '@dungeonmaster/shared/statics';

import { fsWriteFileAdapter } from '../../../adapters/fs/write-file/fs-write-file-adapter';
import { epochMsContract } from '../../../contracts/epoch-ms/epoch-ms-contract';
import { instanceHeartbeatContract } from '../../../contracts/instance-heartbeat/instance-heartbeat-contract';
import type { InstanceHeartbeat } from '../../../contracts/instance-heartbeat/instance-heartbeat-contract';
import type { InstanceId } from '../../../contracts/instance-id/instance-id-contract';
import type { ProcessGroupId } from '../../../contracts/process-group-id/process-group-id-contract';
import { locationsInstanceEvidencePathFindBroker } from '../../locations/instance-evidence-path-find/locations-instance-evidence-path-find-broker';
import { machineRssByPgidBroker } from '../../machine/rss-by-pgid/machine-rss-by-pgid-broker';
import { registryUpdateBroker } from '../../registry/update/registry-update-broker';

export const heartbeatWriteBroker = async ({
  instanceId,
  pid,
  pgids,
  guildId,
}: {
  instanceId: InstanceId;
  pid: ProcessId;
  pgids: readonly ProcessGroupId[];
  guildId: GuildId | null;
}): Promise<InstanceHeartbeat> => {
  const evidenceDir = locationsInstanceEvidencePathFindBroker({ instanceId, guildId });
  const heartbeatPath = absoluteFilePathContract.parse(
    pathJoinAdapter({ paths: [evidenceDir, locationsStatics.siegelense.heartbeat] }),
  );

  const rssMB = await machineRssByPgidBroker({ pgids });

  const heartbeat = instanceHeartbeatContract.parse({
    instanceId,
    pid,
    pgids,
    beatAtMs: epochMsContract.parse(Date.now()),
    rssMB,
  });

  const contents = fileContentsContract.parse(`${JSON.stringify(heartbeat)}\n`);

  // The file lands BEFORE the row is stamped. A crash between the two steps then leaves a row whose
  // beat is one tick stale (a staleness sweep reaps it correctly) and a file that already names the
  // orphaned pgids. The other order leaves a row claiming a fresh beat with no file underneath it —
  // the one state that makes those pgids unreachable.
  await fsWriteFileAdapter({ filePath: heartbeatPath, contents });

  await registryUpdateBroker({
    mutate: (current) => ({
      instances: current.instances.map((entry) =>
        entry.id === instanceId ? { ...entry, lastBeatMs: heartbeat.beatAtMs } : entry,
      ),
    }),
  });

  return heartbeat;
};
