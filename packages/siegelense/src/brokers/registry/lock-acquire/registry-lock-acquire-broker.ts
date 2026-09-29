/**
 * PURPOSE: Acquires `registry.lock` so `registryUpdateBroker`'s read-mutate-write runs exclusive
 * across every process on this machine — the same EXCLUSIVE CREATE mechanism
 * `bootLockAcquireBroker` uses (`fsWriteFileAdapter`'s `exclusive: true`, the `wx` flag), tried
 * FIRST, always: two processes both reading "absent" in the same instant would both then write and
 * both believe they hold it, and the OS performs an exclusive create's existence check and its
 * create as ONE operation, so nothing built out of two separate calls can substitute for it. A
 * failed create (the file is already there) is what triggers the read — to decide whether that
 * file is stale or genuinely gone, never the other way around. `mkdir -p`s the siegelense root
 * first, mirroring `registryWriteBroker` — a fresh machine's home has no `siegelense/` directory
 * yet, and an exclusive create against a missing parent fails ENOENT, a code this broker's EEXIST
 * check does not recognise, so it would otherwise surface that raw errno straight to the caller.
 * `mkdir` only ever touches the directory, never `registry.lock` itself, so it cannot turn the `wx`
 * create into an overwrite. `registryLockReleaseBroker` is the other half of this pair — call it
 * once the read-mutate-write this call gated has finished, on every exit path including a thrown
 * mutate.
 *
 * USAGE:
 * await registryLockAcquireBroker({});
 * // Absent or stale lock: creates registry.lock stamped with now, returns { success: true }.
 * // Fresh lock held by another process: polls until it frees or throws once the wait ceiling
 * // (instanceLifecycleStatics.registryLock.waitCeilingMs) is reached.
 */

import { fsUnlinkAdapter } from '../../../adapters/fs/unlink/fs-unlink-adapter';
import { fsWriteFileAdapter } from '../../../adapters/fs/write-file/fs-write-file-adapter';
import { isNativeError } from '#gateway/node/util__types';
import { locationsRegistryLockPathFindBroker } from '../../locations/registry-lock-path-find/locations-registry-lock-path-find-broker';
import { locationsRootPathFindBroker } from '../../locations/root-path-find/locations-root-path-find-broker';
import { epochMsContract } from '../../../contracts/epoch-ms/epoch-ms-contract';
import type { EpochMs } from '../../../contracts/epoch-ms/epoch-ms-contract';
import { instanceLifecycleStatics } from '../../../statics/instance-lifecycle/instance-lifecycle-statics';
import { ensureDir, readFileIfExists } from '#gateway/node/fs__promises';
import { fileContentsContract } from '@dungeonmaster/shared/contracts';
import type { AdapterResult } from '@dungeonmaster/shared/contracts';

export const registryLockAcquireBroker = async ({
  waitStartedAtMs,
}: {
  waitStartedAtMs?: EpochMs;
}): Promise<AdapterResult> => {
  const startedAtMs = waitStartedAtMs ?? epochMsContract.parse(Date.now());
  const rootPath = locationsRootPathFindBroker();
  const lockPath = locationsRegistryLockPathFindBroker();
  const nowMs = epochMsContract.parse(Date.now());

  await ensureDir(rootPath);

  try {
    await fsWriteFileAdapter({
      filePath: lockPath,
      contents: fileContentsContract.parse(String(nowMs)),
      exclusive: true,
    });

    return { success: true as const };
  } catch (createError) {
    // Anything but "the file is already there" is a real failure (permissions, disk) — propagate
    // it rather than reading a file whose absence has nothing to do with this error. This is a
    // REAL `fs/promises` rejection, built by Node's own internals outside Jest's vm realm, so
    // `createError instanceof Error` reads false even when it genuinely is one —
    // `isNativeError` checks the V8-internal error slot instead, which answers
    // correctly whichever realm constructed the value.
    if (
      createError === null ||
      typeof createError !== 'object' ||
      !isNativeError(createError) ||
      !('code' in createError) ||
      createError.code !== 'EEXIST'
    ) {
      throw createError;
    }
  }

  const existingContents = await readFileIfExists(lockPath);

  if (existingContents === null) {
    return registryLockAcquireBroker({ waitStartedAtMs: startedAtMs });
  }

  const existingAcquiredAtMs = epochMsContract.parse(Number(existingContents));
  const isStale = nowMs - existingAcquiredAtMs > instanceLifecycleStatics.registryLock.ttlMs;

  if (isStale) {
    // Two contenders can read the SAME stale lock and both decide to remove it — under three
    // parallel instances this is not rare, it is the row driver-flow.integration.test.ts's
    // parallel-boot case measured: the loser's unlink finds nothing there and fails ENOENT. That
    // ENOENT means exactly what a genuinely-absent lock means below — a competitor already
    // cleared it — so it is classified and swallowed HERE rather than left to escape unwrapped
    // (fsUnlinkAdapter, unlike fsReadFileAdapter, never wraps its rejection in a `{cause}` Error).
    // Anything else (EACCES, EBUSY, ESTALE) is a real failure and still propagates.
    await fsUnlinkAdapter({ filePath: lockPath }).catch((unlinkError: unknown) => {
      if (
        unlinkError === null ||
        typeof unlinkError !== 'object' ||
        !isNativeError(unlinkError) ||
        !('code' in unlinkError) ||
        unlinkError.code !== 'ENOENT'
      ) {
        throw unlinkError;
      }
    });

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
