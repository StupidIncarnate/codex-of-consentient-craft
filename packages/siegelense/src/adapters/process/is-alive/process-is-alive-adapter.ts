/**
 * PURPOSE: Probes whether a whole process GROUP is still alive via `process.kill(-pgid, 0)` — signal
 * `0` is the POSIX no-op the kernel answers from PID-table membership alone, so this never actually
 * delivers a signal to the tree. This is what lets a SIGKILL pass skip a group a SIGTERM already
 * reaped instead of firing a second real signal that would only log `kill ESRCH` on every clean
 * teardown, and it is what a reaper reads for a pgid recovered off a heartbeat file: after a SIGKILL
 * nothing in memory still holds the pgids it named, so this probe is the only way to tell a live
 * orphan apart from a stale record.
 *
 * USAGE:
 * processIsAliveAdapter({ pgid: ProcessGroupIdStub({ value: 4821 }) });
 * // Live group: true
 * // Group already exited (ESRCH): false
 */

import { kill } from 'process';
import { isNativeError } from 'util/types';

import type { ProcessGroupId } from '../../../contracts/process-group-id/process-group-id-contract';

export const processIsAliveAdapter = ({ pgid }: { pgid: ProcessGroupId }): boolean => {
  try {
    kill(-Number(pgid), 0);
    return true;
  } catch (error) {
    // `process.kill` is a Node builtin — a real ESRCH is built by Node's own internals outside
    // the vm realm a Jest test file runs inside, so `error instanceof Error` reads false even
    // though the value genuinely is one (error-is-native-error-adapter.ts's header documents the
    // same failure). `isNativeError` (from `util/types`, imported directly since this IS the
    // adapter wrapping the builtin — a sibling adapter would violate the no-adapter-imports-
    // adapter rule) checks the V8-internal error slot instead, answering correctly whichever
    // realm constructed the value.
    if (
      error !== null &&
      typeof error === 'object' &&
      isNativeError(error) &&
      'code' in error &&
      error.code === 'ESRCH'
    ) {
      return false;
    }
    throw error;
  }
};
