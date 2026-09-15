/**
 * PURPOSE: Acquires `registry.lock` so `registryUpdateBroker`'s read-mutate-write runs exclusive
 * across every process on this machine — the same EXCLUSIVE CREATE mechanism
 * `bootLockAcquireBroker` uses (`fsWriteFileAdapter`'s `exclusive: true`, the `wx` flag), tried
 * FIRST, always: two processes both reading "absent" in the same instant would both then write and
 * both believe they hold it, and the OS performs an exclusive create's existence check and its
 * create as ONE operation, so nothing built out of two separate calls can substitute for it. A
 * failed create is what triggers the read that decides whether the file on disk is stale or live.
 * `registryLockReleaseBroker` is the other half of this pair — call it once the read-mutate-write
 * this call gated has finished, on every exit path including a thrown mutate.
 *
 * USAGE:
 * await registryLockAcquireBroker({});
 * // Absent or stale lock: creates registry.lock stamped with now, returns { success: true }.
 * // Fresh lock held by another process: polls until it frees or throws once the wait ceiling
 * // (instanceLifecycleStatics.registryLock.waitCeilingMs) is reached.
 */

import { fsReadFileAdapter } from '../../../adapters/fs/read-file/fs-read-file-adapter';
import { fsUnlinkAdapter } from '../../../adapters/fs/unlink/fs-unlink-adapter';
import { fsWriteFileAdapter } from '../../../adapters/fs/write-file/fs-write-file-adapter';
import { locationsRegistryLockPathFindBroker } from '../../locations/registry-lock-path-find/locations-registry-lock-path-find-broker';
import { epochMsContract } from '../../../contracts/epoch-ms/epoch-ms-contract';
import type { EpochMs } from '../../../contracts/epoch-ms/epoch-ms-contract';
import { instanceLifecycleStatics } from '../../../statics/instance-lifecycle/instance-lifecycle-statics';
import { fileContentsContract } from '@dungeonmaster/shared/contracts';
import type { AdapterResult, FileContents } from '@dungeonmaster/shared/contracts';

export const registryLockAcquireBroker = async ({
  waitStartedAtMs,
}: {
  waitStartedAtMs?: EpochMs;
}): Promise<AdapterResult> => {
  const startedAtMs = waitStartedAtMs ?? epochMsContract.parse(Date.now());
  const lockPath = locationsRegistryLockPathFindBroker();
  const nowMs = epochMsContract.parse(Date.now());

  try {
    await fsWriteFileAdapter({
      filePath: lockPath,
      contents: fileContentsContract.parse(String(nowMs)),
      exclusive: true,
    });

    return { success: true as const };
  } catch (createError) {
    // Anything but "the file is already there" is a real failure (permissions, disk) — propagate
    // it rather than reading a file whose absence has nothing to do with this error.
    if (
      !(createError instanceof Error) ||
      !('code' in createError) ||
      createError.code !== 'EEXIST'
    ) {
      throw createError;
    }
  }

  let existingContents: FileContents | null = null;
  try {
    existingContents = await fsReadFileAdapter({ filePath: lockPath });
  } catch {
    // existingContents already holds its ABSENT default (null) — the racing holder released
    // between the failed create above and this read.
  }

  if (existingContents === null) {
    return registryLockAcquireBroker({ waitStartedAtMs: startedAtMs });
  }

  const existingAcquiredAtMs = epochMsContract.parse(Number(existingContents));
  const isStale = nowMs - existingAcquiredAtMs > instanceLifecycleStatics.registryLock.ttlMs;

  if (isStale) {
    await fsUnlinkAdapter({ filePath: lockPath });

    // Removing the stale file and retrying the create are two more operations, so a competitor
    // can still win the re-create in between — that failure falls back through the SAME
    // exclusive-create branch above and reads whatever is there next, rather than this call
    // assuming its own stamp landed.
    return registryLockAcquireBroker({ waitStartedAtMs: startedAtMs });
  }

  if (nowMs - startedAtMs >= instanceLifecycleStatics.registryLock.waitCeilingMs) {
    throw new Error(
      `Registry lock held by another process; gave up after waiting ${nowMs - startedAtMs}ms past the wait ceiling`,
    );
  }

  await new Promise<void>((resolve) => {
    setTimeout(resolve, instanceLifecycleStatics.registryLock.pollMs);
  });

  return registryLockAcquireBroker({ waitStartedAtMs: startedAtMs });
};
