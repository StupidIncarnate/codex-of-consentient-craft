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

import { join } from '#gateway/node/path';

import { readdirIfExists, readFile } from '#gateway/node/fs__promises';
import { stderr } from '#gateway/node/process';
import { profileBootContract } from '../../../contracts/profile-boot/profile-boot-contract';
import type { ProfileBoot } from '../../../contracts/profile-boot/profile-boot-contract';
import { profileObservationContract } from '../../../contracts/profile-observation/profile-observation-contract';
import type { ProfileObservation } from '../../../contracts/profile-observation/profile-observation-contract';
import { specProfileContract } from '../../../contracts/spec-profile/spec-profile-contract';
import type { SpecProfile } from '../../../contracts/spec-profile/spec-profile-contract';
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
  specName: string;
}): Promise<SpecProfile> => {
  const spec = await laneSpecFindBroker({ specName });
  const specHash = laneSpecHashBroker({ spec });
  const { samplesDir, bootsDir } = locationsProfileDirsFindBroker({ specHash });

  const [sampleNamesRaw, bootNamesRaw] = await Promise.all([
    readdirIfExists(samplesDir),
    readdirIfExists(bootsDir),
  ]);
  const sampleNames = sampleNamesRaw ?? [];
  const bootNames = bootNamesRaw ?? [];

  const parsedSamples = await Promise.all(
    sampleNames
      .filter((name) => name.endsWith(profileStatics.extensions.record))
      .map(async (name): Promise<ProfileObservation | null> => {
        const recordPath = join(samplesDir, name);
        const contents = await readFile(recordPath);
        try {
          return profileObservationContract.parse(JSON.parse(contents));
        } catch (error: unknown) {
          stderr.write(
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
        const recordPath = join(bootsDir, name);
        const contents = await readFile(recordPath);
        try {
          return profileBootContract.parse(JSON.parse(contents));
        } catch (error: unknown) {
          stderr.write(
            `[profile-read] skipping an unreadable boot record at ${recordPath}: ${String(error)}\n`,
          );
          return null;
        }
      }),
  );

  const observations = parsedSamples.filter((observation) => observation !== null);
  const boots = parsedBoots.filter((boot) => boot !== null);

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
    processes: (spec.processes.length + (spec.browser ? BROWSER_PROCESS_COUNT : 0)),
    hash: specHash,
    measuredAt:
      measuredAtMs === null
        ? null
        : profileMeasuredDateRenderTransformer({
            measuredAtMs: measuredAtMs,
          }),
    fromRuns: observations.length,
    bootMs: bootMs === null ? null : bootMs,
    samples: profileSamplesGroupTransformer({ observations }),
  });
};
