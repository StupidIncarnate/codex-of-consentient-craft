/**
 * PURPOSE: The whole `profile` call — what one instance of a spec costs, read off the asset tree and
 * folded across every instance ever measured for it (siegelense-tooling.md lines 2517-2528). Starts
 * nothing: a profile is a READ, and only `start`, `run` and `kill` need a live driver (line 2275).
 * Reach for this over reading `profiles/<hash>/` at a call site — `capacity` and the CLI answer from
 * this one shape, and the never-average-across-pool-sizes rule lives in one transformer below it
 * rather than in each caller.
 *
 * The answer is keyed by the spec's CONTENT hash, which is the whole staleness mechanism: add a
 * process to the spec and this resolves a directory that has never been written, so the answer is an
 * honest empty one and measurement restarts — never a confident set of numbers taken against
 * different processes (line 1471).
 *
 * `processes` counts the browser as one, matching the spec's own `api · vite · chromium` example — a
 * browserless spec really does run one fewer process, and pricing it on its own is the point of
 * keying by content (line 2145).
 *
 * A record that will not parse is SKIPPED and reported, never fatal: one corrupt file must not make a
 * whole spec unprofilable, and a silent skip would make a profile quietly thin out instead.
 *
 * USAGE:
 * await profileReadBroker({ specName });
 * // Returns the SpecProfile — samples: [] and bootMs: null for a spec nothing has ever run
 */

import { pathJoinAdapter } from '@dungeonmaster/shared/adapters';
import { absoluteFilePathContract } from '@dungeonmaster/shared/contracts';

import { fsReadFileAdapter } from '../../../adapters/fs/read-file/fs-read-file-adapter';
import { fsReaddirAdapter } from '../../../adapters/fs/readdir/fs-readdir-adapter';
import { epochMsContract } from '../../../contracts/epoch-ms/epoch-ms-contract';
import { profileBootContract } from '../../../contracts/profile-boot/profile-boot-contract';
import type { ProfileBoot } from '../../../contracts/profile-boot/profile-boot-contract';
import { profileObservationContract } from '../../../contracts/profile-observation/profile-observation-contract';
import type { ProfileObservation } from '../../../contracts/profile-observation/profile-observation-contract';
import { readingCountContract } from '../../../contracts/reading-count/reading-count-contract';
import { specProfileContract } from '../../../contracts/spec-profile/spec-profile-contract';
import type { SpecProfile } from '../../../contracts/spec-profile/spec-profile-contract';
import type { SpecName } from '../../../contracts/spec-name/spec-name-contract';
import { profileStatics } from '../../../statics/profile/profile-statics';
import { profileMeasuredDateRenderTransformer } from '../../../transformers/profile-measured-date-render/profile-measured-date-render-transformer';
import { profileSamplesGroupTransformer } from '../../../transformers/profile-samples-group/profile-samples-group-transformer';
import { laneSpecFindBroker } from '../../lane-spec/find/lane-spec-find-broker';
import { laneSpecHashBroker } from '../../lane-spec/hash/lane-spec-hash-broker';
import { locationsProfileDirsFindBroker } from '../../locations/profile-dirs-find/locations-profile-dirs-find-broker';

const BROWSER_PROCESS_COUNT = 1;

export const profileReadBroker = async ({
  specName,
}: {
  specName: SpecName;
}): Promise<SpecProfile> => {
  const spec = await laneSpecFindBroker({ specName });
  const specHash = laneSpecHashBroker({ spec });
  const { samplesDir, bootsDir } = locationsProfileDirsFindBroker({ specHash });

  const [sampleNames, bootNames] = await Promise.all([
    fsReaddirAdapter({ dirPath: samplesDir }),
    fsReaddirAdapter({ dirPath: bootsDir }),
  ]);

  const parsedSamples = await Promise.all(
    sampleNames
      .filter((name) => name.endsWith(profileStatics.extensions.record))
      .map(async (name): Promise<ProfileObservation | null> => {
        const recordPath = absoluteFilePathContract.parse(
          pathJoinAdapter({ paths: [samplesDir, name] }),
        );
        const contents = await fsReadFileAdapter({ filePath: recordPath });
        try {
          return profileObservationContract.parse(JSON.parse(contents));
        } catch (error: unknown) {
          process.stderr.write(
            `[profile-read] skipping an unreadable profile record at ${recordPath}: ${String(error)}\n`,
          );
          return null;
        }
      }),
  );

  const parsedBoots = await Promise.all(
    bootNames
      .filter((name) => name.endsWith(profileStatics.extensions.record))
      .map(async (name): Promise<ProfileBoot | null> => {
        const recordPath = absoluteFilePathContract.parse(
          pathJoinAdapter({ paths: [bootsDir, name] }),
        );
        const contents = await fsReadFileAdapter({ filePath: recordPath });
        try {
          return profileBootContract.parse(JSON.parse(contents));
        } catch (error: unknown) {
          process.stderr.write(
            `[profile-read] skipping an unreadable boot record at ${recordPath}: ${String(error)}\n`,
          );
          return null;
        }
      }),
  );

  const observations = parsedSamples.filter(
    (observation): observation is ProfileObservation => observation !== null,
  );
  const boots = parsedBoots.filter((boot): boot is ProfileBoot => boot !== null);

  const bootMs =
    boots.length === 0
      ? null
      : Math.floor(boots.reduce((total, boot) => total + boot.bootMs, 0) / boots.length);

  const measuredAtMs =
    observations.length === 0
      ? null
      : Math.max(...observations.map((observation) => observation.measuredAtMs));

  return specProfileContract.parse({
    specName,
    processes: readingCountContract.parse(
      spec.processes.length + (spec.browser ? BROWSER_PROCESS_COUNT : 0),
    ),
    hash: specHash,
    measuredAt:
      measuredAtMs === null
        ? null
        : profileMeasuredDateRenderTransformer({
            measuredAtMs: epochMsContract.parse(measuredAtMs),
          }),
    fromRuns: readingCountContract.parse(observations.length),
    bootMs: bootMs === null ? null : epochMsContract.parse(bootMs),
    samples: profileSamplesGroupTransformer({ observations }),
  });
};
