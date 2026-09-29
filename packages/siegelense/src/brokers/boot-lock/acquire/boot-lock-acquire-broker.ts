/**
 * PURPOSE: Acquires `boot.lock` so at most one siegelense instance boots at a time ACROSS every
 * process on the machine — processes that share no memory and cannot see each other, so a file is
 * the only thing all of them can check (spec line 1617, 1620). This matters for measurement, not
 * politeness: a profile's PEAK sample is taken DURING boot (Vite prebundling, Chromium launch), and
 * two instances booting together pollute each other's sample into "a profile that reports a peak
 * neither instance actually has" (spec line 1755) — every later `capacity` answer is then derived
 * from a number true of no real condition.
 *
 * The mechanism is an EXCLUSIVE CREATE (`writeFileExclusive`, the `wx` flag),
 * tried FIRST, always — never a read that decides the lock is absent followed by a separate write.
 * Two processes reading "absent" in the same instant would both then write and both believe they
 * hold the lock; the OS performs an exclusive create's existence check and its create as ONE
 * operation, so nothing built out of two separate calls can substitute for it. A failed create
 * (the file is already there) is what triggers the read — to decide whether that file is stale,
 * live, or this instance's own — never the other way around. `mkdir -p`s the siegelense root first,
 * mirroring `registryLockAcquireBroker` — a fresh machine's home has no `siegelense/` directory
 * yet, and an exclusive create against a missing parent fails ENOENT, a code this broker's EEXIST
 * check does not recognise, so it would otherwise surface that raw errno straight to the caller.
 * `mkdir` only ever touches the directory, never `boot.lock` itself, so it cannot turn the `wx`
 * create into an overwrite. Reach for `bootLockReleaseBroker` once the boot this call gated has
 * finished.
 *
 * USAGE:
 * await bootLockAcquireBroker({ instanceId: InstanceIdStub() });
 * // Absent lock: creates boot.lock stamped with this instance, returns { lock, tookOverStale: false }.
 * // Stale lock (another instance, past TTL): removes it and takes over, tookOverStale: true.
 * // Fresh lock held by this instance: returns it unchanged (idempotent), tookOverStale: false.
 * // Fresh lock held by another instance: polls until it frees or throws BootLockHeldError.
 */

import { now } from '#gateway/node/Date';
import { isFsError } from '#gateway/node/fs';
import { pid } from '#gateway/node/process';
import { setTimeout } from '#gateway/node/setTimeout';
import {
  ensureDir,
  readFileIfExists,
  unlinkIfExists,
  writeFileExclusive,
} from '#gateway/node/fs__promises';
import { locationsBootLockPathFindBroker } from '../../locations/boot-lock-path-find/locations-boot-lock-path-find-broker';
import { locationsRootPathFindBroker } from '../../locations/root-path-find/locations-root-path-find-broker';
import { bootLockContract } from '../../../contracts/boot-lock/boot-lock-contract';
import type { BootLock } from '../../../contracts/boot-lock/boot-lock-contract';
import { epochMsContract } from '../../../contracts/epoch-ms/epoch-ms-contract';
import type { EpochMs } from '../../../contracts/epoch-ms/epoch-ms-contract';
import type { InstanceId } from '../../../contracts/instance-id/instance-id-contract';
import { instanceLifecycleStatics } from '../../../statics/instance-lifecycle/instance-lifecycle-statics';
import { BootLockHeldError } from '../../../errors/boot-lock-held/boot-lock-held-error';
import { processIdContract } from '@dungeonmaster/shared/contracts';

export const bootLockAcquireBroker = async ({
  instanceId,
  waitStartedAtMs,
  tookOverStaleSoFar,
}: {
  instanceId: InstanceId;
  waitStartedAtMs?: EpochMs;
  tookOverStaleSoFar?: boolean;
}): Promise<{ lock: BootLock; tookOverStale: boolean }> => {
  const startedAtMs = waitStartedAtMs ?? epochMsContract.parse(now());
  const rootPath = locationsRootPathFindBroker();
  const bootLockPath = locationsBootLockPathFindBroker();
  const nowMs = epochMsContract.parse(now());
  const tookOverStale = tookOverStaleSoFar ?? false;

  const newLock = bootLockContract.parse({
    heldBy: instanceId,
    heldByPid: processIdContract.parse(String(pid)),
    acquiredAtMs: nowMs,
  });

  await ensureDir(rootPath);

  try {
    await writeFileExclusive(bootLockPath, JSON.stringify(newLock));

    return { lock: newLock, tookOverStale };
  } catch (createError) {
    // Anything but "the file is already there" is a real failure (permissions, disk) — propagate
    // it rather than reading a file whose absence has nothing to do with this error. `isFsError`
    // reads only `.code`, never `instanceof Error`, so a REAL `fs/promises` rejection — built by
    // Node's own internals outside Jest's vm realm — classifies the same as one from this realm.
    if (!isFsError({ error: createError, code: 'EEXIST' })) {
      throw createError;
    }
  }

  const existingContents = await readFileIfExists(bootLockPath);

  if (existingContents === null) {
    return bootLockAcquireBroker({
      instanceId,
      waitStartedAtMs: startedAtMs,
      tookOverStaleSoFar: tookOverStale,
    });
  }

  const existingLock = bootLockContract.parse(JSON.parse(existingContents));

  if (existingLock.heldBy === instanceId) {
    return { lock: existingLock, tookOverStale: false };
  }

  const isStale = nowMs - existingLock.acquiredAtMs > instanceLifecycleStatics.bootLock.ttlMs;

  if (isStale) {
    // Two contenders can read the SAME stale lock and both decide to remove it — under three
    // parallel instances this is not rare, it is the row driver-flow.integration.test.ts's
    // parallel-boot case measured: the loser's unlink finds nothing there and fails ENOENT. That
    // ENOENT means exactly what a genuinely-absent lock means below — a competitor already
    // cleared it — so `unlinkIfExists` resolves on it rather than letting it escape. Anything else
    // (EACCES, EBUSY, ESTALE) is a real failure and still propagates.
    await unlinkIfExists(bootLockPath);

    // Removing the stale file and retrying the create are two more operations, so a competitor
    // can still win the re-create in between — that failure falls back through the SAME
    // exclusive-create branch above and reads whatever is there next, rather than this call
    // assuming its own stamp landed.
    return bootLockAcquireBroker({
      instanceId,
      waitStartedAtMs: startedAtMs,
      tookOverStaleSoFar: true,
    });
  }

  if (nowMs - startedAtMs >= instanceLifecycleStatics.bootLock.waitCeilingMs) {
    throw new BootLockHeldError({
      heldBy: existingLock.heldBy,
      waitedMs: nowMs - startedAtMs,
    });
  }

  await new Promise<void>((resolve) => {
    setTimeout(resolve, instanceLifecycleStatics.bootLock.pollMs);
  });

  return bootLockAcquireBroker({
    instanceId,
    waitStartedAtMs: startedAtMs,
    tookOverStaleSoFar: tookOverStale,
  });
};
