/**
 * PURPOSE: Acquires `registry.lock` so `registryUpdateBroker`'s read-mutate-write runs exclusive
 * across every process on this machine — the same EXCLUSIVE CREATE mechanism
 * `bootLockAcquireBroker` uses (`writeFileExclusive`, the `wx` flag), tried
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

import { isFsError } from '#gateway/node/fs';
import { locationsRegistryLockPathFindBroker } from '../../locations/registry-lock-path-find/locations-registry-lock-path-find-broker';
import { locationsRootPathFindBroker } from '../../locations/root-path-find/locations-root-path-find-broker';
import { epochMsContract } from '../../../contracts/epoch-ms/epoch-ms-contract';
import type { EpochMs } from '../../../contracts/epoch-ms/epoch-ms-contract';
import { instanceLifecycleStatics } from '../../../statics/instance-lifecycle/instance-lifecycle-statics';
import {
  ensureDir,
  readFileIfExists,
  unlinkIfExists,
  writeFileExclusive,
} from '#gateway/node/fs__promises';
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
    await writeFileExclusive(lockPath, String(nowMs));

    return { success: true as const };
  } catch (createError) {
    // Anything but "the file is already there" is a real failure (permissions, disk) — propagate
    // it rather than reading a file whose absence has nothing to do with this error. `isFsError`
    // reads only `.code`, never `instanceof Error`, so a REAL `fs/promises` rejection — built by
    // Node's own internals outside Jest's vm realm — classifies the same as one from this realm.
    if (!isFsError({ error: createError, code: 'EEXIST' })) {
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
    // cleared it — so `unlinkIfExists` resolves on it rather than letting it escape. Anything else
    // (EACCES, EBUSY, ESTALE) is a real failure and still propagates.
    await unlinkIfExists(lockPath);

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
