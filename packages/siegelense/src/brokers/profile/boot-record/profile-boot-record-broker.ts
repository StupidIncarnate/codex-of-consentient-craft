/**
 * PURPOSE: Records what one instance's boot actually COST, into `profiles/<specHash>/boots/`. The
 * client half of `start` is the only side that sees a boot begin — it spawns the driver and waits for
 * the socket to answer — so it is the only side that can measure this, and `bootMs` is the one figure
 * siegelense-tooling.md line 1483 says is genuinely measured rather than illustrative. Reach for this
 * over `profileSampleRecordBroker`: that one is the DRIVER's per-beat memory record, written many
 * times across an instance's life; this is written once, by a different process, which is why the two
 * live in sibling directories and never share a file.
 *
 * One file per instance, named by the instance id, so nothing here read-modify-writes a path another
 * process might also be writing — the registry is the only place in this design that needs a lock,
 * and a profile must not become the second.
 *
 * USAGE:
 * await profileBootRecordBroker({ instanceId, specHash, bootMs });
 * // Writes profiles/<specHash>/boots/<instanceId>.json and returns the written ProfileBoot
 */

import { fsMkdirAdapter, pathJoinAdapter } from '@dungeonmaster/shared/adapters';
import {
  absoluteFilePathContract,
  fileContentsContract,
  filePathContract,
} from '@dungeonmaster/shared/contracts';

import { fsWriteFileAdapter } from '../../../adapters/fs/write-file/fs-write-file-adapter';
import { epochMsContract } from '../../../contracts/epoch-ms/epoch-ms-contract';
import type { EpochMs } from '../../../contracts/epoch-ms/epoch-ms-contract';
import type { InstanceId } from '../../../contracts/instance-id/instance-id-contract';
import { profileBootContract } from '../../../contracts/profile-boot/profile-boot-contract';
import type { ProfileBoot } from '../../../contracts/profile-boot/profile-boot-contract';
import type { SpecHash } from '../../../contracts/spec-hash/spec-hash-contract';
import { profileStatics } from '../../../statics/profile/profile-statics';
import { locationsProfileDirsFindBroker } from '../../locations/profile-dirs-find/locations-profile-dirs-find-broker';

export const profileBootRecordBroker = async ({
  instanceId,
  specHash,
  bootMs,
}: {
  instanceId: InstanceId;
  specHash: SpecHash;
  bootMs: EpochMs;
}): Promise<ProfileBoot> => {
  const { bootsDir } = locationsProfileDirsFindBroker({ specHash });

  const recordPath = absoluteFilePathContract.parse(
    pathJoinAdapter({
      paths: [bootsDir, `${instanceId}${profileStatics.extensions.record}`],
    }),
  );

  const record = profileBootContract.parse({
    instanceId,
    specHash,
    bootMs,
    recordedAtMs: epochMsContract.parse(Date.now()),
  });

  await fsMkdirAdapter({ filepath: filePathContract.parse(bootsDir) });
  await fsWriteFileAdapter({
    filePath: recordPath,
    contents: fileContentsContract.parse(`${JSON.stringify(record)}\n`),
  });

  return record;
};
