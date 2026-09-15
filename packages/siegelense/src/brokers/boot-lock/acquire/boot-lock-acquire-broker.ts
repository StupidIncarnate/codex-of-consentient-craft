/**
 * PURPOSE: Acquires `boot.lock` so at most one siegelense instance boots at a time ACROSS every
 * process on the machine — processes that share no memory and cannot see each other, so a file is
 * the only thing all of them can check (spec line 1617, 1620). This matters for measurement, not
 * politeness: a profile's PEAK sample is taken DURING boot (Vite prebundling, Chromium launch), and
 * two instances booting together pollute each other's sample into "a profile that reports a peak
 * neither instance actually has" (spec line 1755) — every later `capacity` answer is then derived
 * from a number true of no real condition.
 *
 * The mechanism is an EXCLUSIVE CREATE (`fsWriteFileAdapter`'s `exclusive: true`, the `wx` flag),
 * tried FIRST, always — never a read that decides the lock is absent followed by a separate write.
 * Two processes reading "absent" in the same instant would both then write and both believe they
 * hold the lock; the OS performs an exclusive create's existence check and its create as ONE
 * operation, so nothing built out of two separate calls can substitute for it. A failed create
 * (the file is already there) is what triggers the read — to decide whether that file is stale,
 * live, or this instance's own — never the other way around. Reach for `bootLockReleaseBroker`
 * once the boot this call gated has finished.
 *
 * USAGE:
 * await bootLockAcquireBroker({ instanceId: InstanceIdStub() });
 * // Absent lock: creates boot.lock stamped with this instance, returns { lock, tookOverStale: false }.
 * // Stale lock (another instance, past TTL): removes it and takes over, tookOverStale: true.
 * // Fresh lock held by this instance: returns it unchanged (idempotent), tookOverStale: false.
 * // Fresh lock held by another instance: polls until it frees or throws BootLockHeldError.
 */

import { fsReadFileAdapter } from '../../../adapters/fs/read-file/fs-read-file-adapter';
import { fsUnlinkAdapter } from '../../../adapters/fs/unlink/fs-unlink-adapter';
import { fsWriteFileAdapter } from '../../../adapters/fs/write-file/fs-write-file-adapter';
import { locationsBootLockPathFindBroker } from '../../locations/boot-lock-path-find/locations-boot-lock-path-find-broker';
import { bootLockContract } from '../../../contracts/boot-lock/boot-lock-contract';
import type { BootLock } from '../../../contracts/boot-lock/boot-lock-contract';
import { epochMsContract } from '../../../contracts/epoch-ms/epoch-ms-contract';
import type { EpochMs } from '../../../contracts/epoch-ms/epoch-ms-contract';
import type { InstanceId } from '../../../contracts/instance-id/instance-id-contract';
import { instanceLifecycleStatics } from '../../../statics/instance-lifecycle/instance-lifecycle-statics';
import { BootLockHeldError } from '../../../errors/boot-lock-held/boot-lock-held-error';
import { processIdContract, fileContentsContract } from '@dungeonmaster/shared/contracts';

export const bootLockAcquireBroker = async ({
  instanceId,
  waitStartedAtMs,
  tookOverStaleSoFar,
}: {
  instanceId: InstanceId;
  waitStartedAtMs?: EpochMs;
  tookOverStaleSoFar?: boolean;
}): Promise<{ lock: BootLock; tookOverStale: boolean }> => {
  const startedAtMs = waitStartedAtMs ?? epochMsContract.parse(Date.now());
  const bootLockPath = locationsBootLockPathFindBroker();
  const nowMs = epochMsContract.parse(Date.now());
  const tookOverStale = tookOverStaleSoFar ?? false;

  const newLock = bootLockContract.parse({
    heldBy: instanceId,
    heldByPid: processIdContract.parse(String(process.pid)),
    acquiredAtMs: nowMs,
  });

  try {
    await fsWriteFileAdapter({
      filePath: bootLockPath,
      contents: fileContentsContract.parse(JSON.stringify(newLock)),
      exclusive: true,
    });

    return { lock: newLock, tookOverStale };
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

  try {
    const existingContents = await fsReadFileAdapter({ filePath: bootLockPath });
    const existingLock = bootLockContract.parse(JSON.parse(existingContents));

    if (existingLock.heldBy === instanceId) {
      return { lock: existingLock, tookOverStale: false };
    }

    const isStale = nowMs - existingLock.acquiredAtMs > instanceLifecycleStatics.bootLock.ttlMs;

    if (isStale) {
      await fsUnlinkAdapter({ filePath: bootLockPath });

      // Removing the stale file and retrying the create are two more operations, so a competitor
      // can still win the re-create in between — that failure falls back through the SAME
      // exclusive-create branch above and reads whatever is there next, rather than this call
      // assuming its own stamp landed.
      return await bootLockAcquireBroker({
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

    return await bootLockAcquireBroker({
      instanceId,
      waitStartedAtMs: startedAtMs,
      tookOverStaleSoFar: tookOverStale,
    });
  } catch (readError) {
    // This catch exists to classify exactly ONE thing: whether fsReadFileAdapter's OWN failure
    // means `boot.lock` is genuinely absent. fsReadFileAdapter wraps every failure in a generic
    // Error with the original as `cause`, so the code the OS actually raised sits one level down.
    // ENOENT alone means the file the failed create tripped over is gone by the time of this read
    // — its holder released it in between, and retrying the exclusive create is correct. Every
    // other error reaching here — a real read failure (EMFILE while this instance's own boot
    // starves file descriptors, a transient EACCES, an ESTALE handle on a networked home), a
    // corrupt lock file, `BootLockHeldError`, or a rejection bubbling up from one of the recursive
    // calls above — fails this shape check and is rethrown UNCHANGED, so this branch is a no-op
    // for anything that did not originate as an absence at the read itself. Treating a real
    // failure as absence spins the exclusive create forever, since the classification below —
    // including the wait-ceiling check — is only reachable once a read actually succeeds.
    if (
      !(readError instanceof Error) ||
      !(readError.cause instanceof Error) ||
      !('code' in readError.cause) ||
      readError.cause.code !== 'ENOENT'
    ) {
      throw readError;
    }

    return bootLockAcquireBroker({
      instanceId,
      waitStartedAtMs: startedAtMs,
      tookOverStaleSoFar: tookOverStale,
    });
  }
};
