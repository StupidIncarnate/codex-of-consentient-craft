/**
 * PURPOSE: Folds ONE heartbeat's measured RSS into this instance's profile record — the sampler
 * siegelense-tooling.md line 1469 calls for ("while an instance runs, sum the RSS of every process in
 * its group, every few seconds"). The heartbeat already measures that sum over the instance's own
 * pgids; this broker is what makes the reading outlive the beat. Reach for this over
 * `profileBootRecordBroker`: that one writes the boot time once from the client side, this one writes
 * memory many times from inside the driver, and the two never share a file.
 *
 * `rssMB: null` writes nothing at all. A beat whose measurement failed or ran on a machine with no
 * `/proc` has no reading to record, and inventing a zero would drag every pooled steady figure down
 * by a beat that measured nothing.
 *
 * POOL SIZE is counted here rather than passed in, because only the registry knows it: instances with
 * `state: 'alive'` AND a stamped `bootedAtMs` — running, therefore costing memory. A reservation has
 * booted nothing and is excluded; the beating instance is itself one of the rows, which is why the
 * count floors at one. The record keys its buckets by that size so a reading taken solo is never
 * blended with one taken under contention (line 1489).
 *
 * The whole record is rewritten on every beat, single-writer, by the one driver that owns this
 * instance — so a SIGKILL leaves every reading already taken on disk, and nothing here
 * read-modify-writes a path a second process might also be writing.
 *
 * USAGE:
 * await profileSampleRecordBroker({ instanceId, specName, rssMB, beatAtMs });
 * // Writes profiles/<specHash>/samples/<instanceId>.json, or returns null when rssMB was null
 */

import {
  fsExistsSyncAdapter,
  fsMkdirAdapter,
  pathJoinAdapter,
} from '@dungeonmaster/shared/adapters';
import {
  absoluteFilePathContract,
  fileContentsContract,
  filePathContract,
} from '@dungeonmaster/shared/contracts';

import { fsReadFileAdapter } from '../../../adapters/fs/read-file/fs-read-file-adapter';
import { fsWriteFileAdapter } from '../../../adapters/fs/write-file/fs-write-file-adapter';
import type { EpochMs } from '../../../contracts/epoch-ms/epoch-ms-contract';
import type { InstanceId } from '../../../contracts/instance-id/instance-id-contract';
import type { Megabytes } from '../../../contracts/megabytes/megabytes-contract';
import { profileObservationContract } from '../../../contracts/profile-observation/profile-observation-contract';
import type { ProfileObservation } from '../../../contracts/profile-observation/profile-observation-contract';
import { profilePoolSizeContract } from '../../../contracts/profile-pool-size/profile-pool-size-contract';
import type { SpecName } from '../../../contracts/spec-name/spec-name-contract';
import { profileStatics } from '../../../statics/profile/profile-statics';
import { profileObservationMergeTransformer } from '../../../transformers/profile-observation-merge/profile-observation-merge-transformer';
import { laneSpecFindBroker } from '../../lane-spec/find/lane-spec-find-broker';
import { laneSpecHashBroker } from '../../lane-spec/hash/lane-spec-hash-broker';
import { locationsProfileDirsFindBroker } from '../../locations/profile-dirs-find/locations-profile-dirs-find-broker';
import { registryReadBroker } from '../../registry/read/registry-read-broker';

const SOLO_POOL_SIZE = 1;

export const profileSampleRecordBroker = async ({
  instanceId,
  specName,
  rssMB,
  beatAtMs,
}: {
  instanceId: InstanceId;
  specName: SpecName;
  rssMB: Megabytes | null;
  beatAtMs: EpochMs;
}): Promise<ProfileObservation | null> => {
  if (rssMB === null) {
    return null;
  }

  const spec = laneSpecFindBroker({ specName });
  const specHash = laneSpecHashBroker({ spec });

  const registry = await registryReadBroker();
  const runningCount = registry.instances.filter(
    (entry) => entry.state === 'alive' && entry.bootedAtMs !== null,
  ).length;
  const poolSize = profilePoolSizeContract.parse(Math.max(runningCount, SOLO_POOL_SIZE));

  const { samplesDir } = locationsProfileDirsFindBroker({ specHash });
  const recordPath = absoluteFilePathContract.parse(
    pathJoinAdapter({ paths: [samplesDir, `${instanceId}${profileStatics.extensions.record}`] }),
  );

  let existing: ProfileObservation | null = null;
  if (fsExistsSyncAdapter({ filePath: filePathContract.parse(recordPath) })) {
    const contents = await fsReadFileAdapter({ filePath: recordPath });
    try {
      existing = profileObservationContract.parse(JSON.parse(contents));
    } catch (error: unknown) {
      // A record this driver cannot read is one it is about to replace anyway — the alternative,
      // throwing, would take the heartbeat's own tick down with it over a file nothing else reads.
      // Reported rather than swallowed: a record that keeps resetting is worth knowing about.
      process.stderr.write(
        `[profile-sample-record] discarding an unreadable profile record at ${recordPath}: ${String(error)}\n`,
      );
    }
  }

  const merged = profileObservationMergeTransformer({
    observation: existing,
    instanceId,
    specHash,
    poolSize,
    rssMB,
    beatAtMs,
  });

  await fsMkdirAdapter({ filepath: filePathContract.parse(samplesDir) });
  await fsWriteFileAdapter({
    filePath: recordPath,
    contents: fileContentsContract.parse(`${JSON.stringify(merged)}\n`),
  });

  return merged;
};
