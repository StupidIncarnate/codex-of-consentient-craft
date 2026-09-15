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

import { errorIsNativeErrorAdapter } from '../../../adapters/error/is-native-error/error-is-native-error-adapter';
import { fsReadFileAdapter } from '../../../adapters/fs/read-file/fs-read-file-adapter';
import { fsUnlinkAdapter } from '../../../adapters/fs/unlink/fs-unlink-adapter';
import { fsWriteFileAdapter } from '../../../adapters/fs/write-file/fs-write-file-adapter';
import { locationsRegistryLockPathFindBroker } from '../../locations/registry-lock-path-find/locations-registry-lock-path-find-broker';
import { locationsRootPathFindBroker } from '../../locations/root-path-find/locations-root-path-find-broker';
import { epochMsContract } from '../../../contracts/epoch-ms/epoch-ms-contract';
import type { EpochMs } from '../../../contracts/epoch-ms/epoch-ms-contract';
import { instanceLifecycleStatics } from '../../../statics/instance-lifecycle/instance-lifecycle-statics';
import { fsMkdirAdapter } from '@dungeonmaster/shared/adapters';
import { fileContentsContract, filePathContract } from '@dungeonmaster/shared/contracts';
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

  await fsMkdirAdapter({ filepath: filePathContract.parse(rootPath) });

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
    // `errorIsNativeErrorAdapter` checks the V8-internal error slot instead, which answers
    // correctly whichever realm constructed the value. The adapter call itself narrows nothing (a
    // destructured-object parameter can't narrow the caller's own variable), so the null/typeof
    // checks ahead of it are what let `createError.code` typecheck below.
    if (
      createError === null ||
      typeof createError !== 'object' ||
      !errorIsNativeErrorAdapter({ value: createError }) ||
      !('code' in createError) ||
      createError.code !== 'EEXIST'
    ) {
      throw createError;
    }
  }

  try {
    const existingContents = await fsReadFileAdapter({ filePath: lockPath });
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
          !errorIsNativeErrorAdapter({ value: unlinkError }) ||
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
      return await registryLockAcquireBroker({ waitStartedAtMs: startedAtMs });
    }

    if (nowMs - startedAtMs >= instanceLifecycleStatics.registryLock.waitCeilingMs) {
      throw new Error(
        `Registry lock held by another process; gave up after waiting ${nowMs - startedAtMs}ms past the wait ceiling`,
      );
    }

    await new Promise<void>((resolve) => {
      setTimeout(resolve, instanceLifecycleStatics.registryLock.pollMs);
    });

    return await registryLockAcquireBroker({ waitStartedAtMs: startedAtMs });
  } catch (readError) {
    // This catch exists to classify exactly ONE thing: whether fsReadFileAdapter's OWN failure
    // means `registry.lock` is genuinely absent. fsReadFileAdapter wraps every failure in a
    // generic Error with the original as `cause`, so the code the OS actually raised sits one
    // level down. ENOENT alone means the file the failed create tripped over is gone by the time
    // of this read — its holder released it in between, and retrying the exclusive create is
    // correct. Every other error reaching here — a real read failure (EMFILE while an instance is
    // mid-spin-up of an API server, a Vite server and Chromium, a transient EACCES, an ESTALE
    // handle on a networked home), a corrupt lock file, the wait-ceiling error thrown above, a
    // NON-ENOENT failure from the stale-lock unlink above (its own ENOENT is classified and
    // swallowed at the unlink site itself, since a competitor beating this call to the same
    // cleanup is benign, not an absence this read needs to reason about), or a rejection bubbling
    // up from one of the recursive calls above — fails this shape check and is rethrown UNCHANGED, so this branch
    // is a no-op for anything that did not originate as an absence at the read itself. Treating a
    // real failure as absence spins the exclusive create forever, since the classification above —
    // including the wait-ceiling check — is only reachable once a read actually succeeds.
    // `errorIsNativeErrorAdapter` replaces `instanceof Error` on BOTH `readError` and its `.cause`:
    // `readError` is usually this broker's own wrapping `new Error(...)`, safely same-realm, but it
    // can also be a raw, unwrapped `fs/promises` rejection reaching here directly from the stale-
    // lock unlink above — and `.cause`, when present, is always a raw rejection. Both are built by
    // Node's own internals outside Jest's vm realm, where `instanceof Error` reads false even
    // though the value genuinely is one. As above, the null/typeof checks ahead of each adapter
    // call are what let the later property accesses typecheck.
    if (
      readError === null ||
      typeof readError !== 'object' ||
      !errorIsNativeErrorAdapter({ value: readError }) ||
      !('cause' in readError) ||
      readError.cause === null ||
      typeof readError.cause !== 'object' ||
      !errorIsNativeErrorAdapter({ value: readError.cause }) ||
      !('code' in readError.cause) ||
      readError.cause.code !== 'ENOENT'
    ) {
      throw readError;
    }

    return registryLockAcquireBroker({ waitStartedAtMs: startedAtMs });
  }
};
